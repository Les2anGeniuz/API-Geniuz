import { supabaseAdmin } from '../services/supabase.js'

const SELECT_KELAS = `
  id_Kelas,
  id_Fakultas,
  id_Mentor,
  nama_kelas,
  deskripsi,
  Fakultas (
    id_Fakultas,
    nama_fakultas
  ),
  Mentor (
    id_Mentor,
    nama_mentor
  ),
  Materi (*),
  Tugas (*)
`

export const listAdminKelas = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || '1'))
    const limit = Math.max(1, Number(req.query.limit || '10'))
    const offset = (page - 1) * limit

    const search = (req.query.search || '').toString().trim()
    const fakultas = req.query.fakultas ? String(req.query.fakultas) : null
    const mentor = req.query.mentor ? String(req.query.mentor) : null

    let q = supabaseAdmin
      .from('Kelas')
      .select(SELECT_KELAS, { count: 'exact' })
      .order('id_Kelas', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      const safe = search.replace(/[%()]/g, '')
      q = q.or(`nama_kelas.ilike.%${safe}%,deskripsi.ilike.%${safe}%`)
    }

    if (fakultas) q = q.eq('id_Fakultas', fakultas)
    if (mentor) q = q.eq('id_Mentor', mentor)

    const { data, error, count } = await q
    if (error) return res.status(500).json({ error: error.message })

    const total = count || 0
    const totalPages = Math.max(1, Math.ceil(total / limit))

    return res.status(200).json({
      data: data || [],
      meta: { page, limit, total, totalPages }
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getAdminKelasById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('Kelas')
      .select(SELECT_KELAS)
      .eq('id_Kelas', id)
      .single()

    if (error) return res.status(404).json({ error: 'Kelas not found' })

    return res.status(200).json({ data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const createAdminKelas = async (req, res) => {
  try {
    const { nama_kelas, id_Fakultas, id_Mentor, deskripsi } = req.body || {}

    if (!nama_kelas || !id_Fakultas) {
      return res.status(400).json({ error: 'nama_kelas dan id_Fakultas wajib' })
    }

    const payload = {
      nama_kelas,
      id_Fakultas,
      deskripsi: deskripsi ?? null
    }

    if (id_Mentor !== undefined) payload.id_Mentor = id_Mentor ?? null

    const { data, error } = await supabaseAdmin
      .from('Kelas')
      .insert([payload])
      .select(SELECT_KELAS)
      .single()

    if (error) return res.status(400).json({ error: error.message })

    return res.status(201).json({ data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const updateAdminKelas = async (req, res) => {
  try {
    const { id } = req.params
    const { nama_kelas, id_Fakultas, id_Mentor, deskripsi } = req.body || {}

    const patch = {}
    if (nama_kelas !== undefined) patch.nama_kelas = nama_kelas
    if (id_Fakultas !== undefined) patch.id_Fakultas = id_Fakultas
    if (id_Mentor !== undefined) patch.id_Mentor = id_Mentor
    if (deskripsi !== undefined) patch.deskripsi = deskripsi

    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'Tidak ada field untuk diupdate' })
    }

    const { data, error } = await supabaseAdmin
      .from('Kelas')
      .update(patch)
      .eq('id_Kelas', id)
      .select(SELECT_KELAS)
      .single()

    if (error) return res.status(400).json({ error: error.message })

    return res.status(200).json({ data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const deleteAdminKelas = async (req, res) => {
  try {
    const { id } = req.params
    // Delete dependent Tugas first (cascade manually)
    const { error: tugasErr } = await supabaseAdmin
      .from('Tugas')
      .delete()
      .eq('id_Kelas', id)

    if (tugasErr) return res.status(400).json({ error: tugasErr.message })

    const { error } = await supabaseAdmin
      .from('Kelas')
      .delete()
      .eq('id_Kelas', id)

    if (error) return res.status(400).json({ error: error.message })

    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
