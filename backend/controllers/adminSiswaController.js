// Pie chart: distribusi siswa per fakultas
export const siswaPerFakultas = async (req, res) => {
  try {
    // Ambil semua pendaftaran yang sudah punya id_Fakultas
    const { data: daftar, error: daftarError } = await supabaseAdmin
      .from('Pendaftaran')
      .select('id_Fakultas')
      .not('id_Fakultas', 'is', null);
    if (daftarError) return res.status(500).json({ error: daftarError.message });
    const fakultasIds = [...new Set((daftar || []).map(d => d.id_Fakultas).filter(Boolean))];
    if (!fakultasIds.length) return res.json({ labels: [], counts: [] });
    // Ambil nama fakultas
    const { data: fakultasRows, error: fakultasError } = await supabaseAdmin
      .from('Fakultas')
      .select('id_Fakultas, nama_fakultas')
      .in('id_Fakultas', fakultasIds);
    if (fakultasError) return res.status(500).json({ error: fakultasError.message });
    // Hitung jumlah siswa per fakultas
    const countMap = {};
    (daftar || []).forEach(d => {
      if (d.id_Fakultas) countMap[d.id_Fakultas] = (countMap[d.id_Fakultas] || 0) + 1;
    });
    const labels = fakultasRows.map(f => f.nama_fakultas);
    const counts = fakultasRows.map(f => countMap[f.id_Fakultas] || 0);
    return res.json({ labels, counts });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' });
  }
};
import { supabaseAdmin } from '../services/supabase.js'

export const listAdminSiswa = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.max(1, Number(req.query.limit || 10))
    const offset = (page - 1) * limit
    const search = (req.query.search || '').toString().trim()
    const statusFilter = (req.query.status || 'all').toString()

    // Jika ada filter status, ambil dulu userId yang punya pendaftaran dengan status tsb
    let userIdsFilter = null
    if (statusFilter && statusFilter !== 'all') {
      const { data: daftarFiltered, error: daftarFilterError } = await supabaseAdmin
        .from('Pendaftaran')
        .select('id_User')
        .eq('status_pendaftaran', statusFilter)

      if (daftarFilterError) return res.status(500).json({ error: daftarFilterError.message })

      const ids = [...new Set((daftarFiltered || []).map(d => d.id_User).filter(Boolean))]
      if (!ids.length) {
        return res.json({ data: [], meta: { page, limit, total: 0, totalPage: 0, totalPages: 0 } })
      }
      userIdsFilter = ids
    }

    let q = supabaseAdmin
      .from('User')
      .select('id_User, nama_lengkap, email, created_at', { count: 'exact' })
      .order('id_User', { ascending: false })
      .range(offset, offset + limit - 1)

      if (search) {
        const safe = search.replace(/[%()]/g, '')
        q = q.or(`nama_lengkap.ilike.%${safe}%,email.ilike.%${safe}%`)
      }

    if (userIdsFilter) {
      q = q.in('id_User', userIdsFilter)
    }

    const { data, error, count } = await q
    if (error) return res.status(500).json({ error: error.message })

    const userIds = (data || []).map(u => u.id_User).filter(Boolean)

    // Ambil pendaftaran per user (untuk tanggal daftar, status, fakultas) dan map fakultas
    let pendaftaranMap = new Map()
    let fakultasMap = new Map()

    if (userIds.length) {
      let daftarQuery = supabaseAdmin
        .from('Pendaftaran')
        .select('id_User, id_Fakultas, tanggal_pendaftaran, status_pendaftaran')
        .in('id_User', userIds)
        .order('tanggal_pendaftaran', { ascending: false })

      if (statusFilter && statusFilter !== 'all') {
        daftarQuery = daftarQuery.eq('status_pendaftaran', statusFilter)
      }

      const { data: daftarRows, error: daftarError } = await daftarQuery
      if (daftarError) return res.status(500).json({ error: daftarError.message })

      ;(daftarRows || []).forEach(row => {
        // Simpan pendaftaran terbaru yang match status
        if (!pendaftaranMap.has(row.id_User)) {
          pendaftaranMap.set(row.id_User, row)
        }
      })

      const fakultasIds = [...new Set((daftarRows || []).map(d => d.id_Fakultas).filter(Boolean))]
      if (fakultasIds.length) {
        const { data: fakultasRows, error: fakultasError } = await supabaseAdmin
          .from('Fakultas')
          .select('id_Fakultas, nama_fakultas')
          .in('id_Fakultas', fakultasIds)

        if (fakultasError) return res.status(500).json({ error: fakultasError.message })

        fakultasMap = new Map()
        ;(fakultasRows || []).forEach(f => fakultasMap.set(f.id_Fakultas, f.nama_fakultas))
      }
    }

    // Ambil last activity dari Progress (Last_update terbaru per user)
    let lastActiveMap = new Map()
    if (userIds.length) {
      const { data: progressRows, error: progressError } = await supabaseAdmin
        .from('Progress')
        .select('id_User, Last_update')
        .in('id_User', userIds)
        .order('Last_update', { ascending: false })

      if (progressError) return res.status(500).json({ error: progressError.message })

      ;(progressRows || []).forEach(row => {
        if (!lastActiveMap.has(row.id_User)) {
          lastActiveMap.set(row.id_User, row.Last_update)
        }
      })
    }

    const normalized = (data || []).map(u => {
      const daftar = pendaftaranMap.get(u.id_User)
      const fakultasNama = daftar?.id_Fakultas ? fakultasMap.get(daftar.id_Fakultas) || null : null
      return {
        id_user: u.id_User,
        nama_lengkap: u.nama_lengkap,
        email: u.email,
        fakultas: fakultasNama,
        tanggal_pendaftaran: daftar?.tanggal_pendaftaran || u.created_at || null,
        status: daftar?.status_pendaftaran || 'pending'
      }
    })

    return res.json({
      data: normalized,
      meta: {
        page,
        limit,
        total: count || 0,
        totalPage: Math.ceil(((count || 0) || 1) / limit),
        totalPages: Math.ceil(((count || 0) || 1) / limit)
      }
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getAdminSiswaById = async (req, res) => {
  try {
    const { id } = req.params
    const include = (req.query.include || '').toString()

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('id_User, nama_lengkap, email, created_at')
      .eq('id_User', id)
      .single()

    if (error) return res.status(404).json({ error: 'Siswa tidak ditemukan' })

    if (!include) return res.json({ data: user })

    const wantPendaftaran = include.split(',').map(s => s.trim()).includes('pendaftaran')
    const wantPembayaran = include.split(',').map(s => s.trim()).includes('pembayaran')

    let pendaftaran = null
    let pembayaran = null

    if (wantPendaftaran || wantPembayaran) {
      const { data: daftarRows, error: daftarError } = await supabaseAdmin
        .from('Pendaftaran')
        .select('id_Pendaftaran, id_User, tanggal_pendaftaran, status_pendaftaran, Domisili, Tanggal_Lahir, Jurusan, Semester, Instansi, Nama_Lengkap, Email, id_Fakultas')
        .eq('id_User', id)
        .order('tanggal_pendaftaran', { ascending: false })

      if (daftarError) return res.status(500).json({ error: daftarError.message })
      pendaftaran = daftarRows || []

      if (wantPembayaran) {
        const daftarIds = (daftarRows || []).map(d => d.id_Pendaftaran).filter(Boolean)
        if (daftarIds.length) {
          const { data: bayarRows, error: bayarError } = await supabaseAdmin
            .from('Pembayaran')
            .select('id_Pembayaran, id_Pendaftaran, jumlah_bayar, metode_pembayaran, tanggal_bayar, status_pembayaran')
            .in('id_Pendaftaran', daftarIds)
            .order('tanggal_bayar', { ascending: false })

          if (bayarError) return res.status(500).json({ error: bayarError.message })
          pembayaran = bayarRows || []
        } else {
          pembayaran = []
        }
      }
    }

    return res.json({
      data: {
        ...user,
        ...(wantPendaftaran ? { pendaftaran } : {}),
        ...(wantPembayaran ? { pembayaran } : {})
      }
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const updateAdminSiswa = async (req, res) => {
  try {
    const { id } = req.params
    const { nama_lengkap, email, password } = req.body || {}

    const patch = {}
    if (nama_lengkap !== undefined) patch.nama_lengkap = nama_lengkap
    if (email !== undefined) patch.email = email
    if (password !== undefined) patch.password = password

    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'Tidak ada field untuk diupdate' })
    }

    const { data, error } = await supabaseAdmin
      .from('User')
      .update(patch)
      .eq('id_User', id)
      .select('id_User, nama_lengkap, email, created_at')
      .single()

    if (error) return res.status(400).json({ error: error.message })

    return res.json({ data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const deleteAdminSiswa = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('User')
      .delete()
      .eq('id_User', id)

    if (error) return res.status(400).json({ error: error.message })

    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
