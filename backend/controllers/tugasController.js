import { supabaseAdmin } from '../services/supabase.js'

export const getTugasByKelas = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('Tugas')
      .select('id_Tugas, id_Kelas, judul_tugas, deskripsi, tanggal_mulai, tanggal_selesai, tenggat_waktu, lampiran, status')
      .eq('id_Kelas', id)
      .order('tanggal_mulai', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ tugas: data || [] })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getTugasById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('Tugas')
      .select('id_Tugas, id_Kelas, judul_tugas, deskripsi, tanggal_mulai, tanggal_selesai, tenggat_waktu, lampiran, status')
      .eq('id_Tugas', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Tugas not found' })
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ tugas: data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getActiveTugasForUser = async (req, res) => {
  try {
    const userId = req.user?.id_User
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { data: pendaftarans, error: daftarError } = await supabaseAdmin
      .from('Pendaftaran')
      .select('id_Kelas, status_pendaftaran')
      .eq('id_User', userId)

    if (daftarError) return res.status(500).json({ error: daftarError.message })

    const kelasIds = [...new Set((pendaftarans || [])
      .filter(p => p.status_pendaftaran === 'aktif')
      .map(p => p.id_Kelas)
      .filter(Boolean))]

    if (!kelasIds.length) return res.status(200).json({ tugas: [] })

    const now = new Date().toISOString()

    const { data: tugasRows, error: tugasError } = await supabaseAdmin
      .from('Tugas')
      .select('id_Tugas, id_Kelas, judul_tugas, deskripsi, tanggal_mulai, tanggal_selesai, tenggat_waktu, lampiran, status')
      .in('id_Kelas', kelasIds)
      .gte('tanggal_selesai', now)

    if (tugasError) return res.status(500).json({ error: tugasError.message })

    const tugasIds = tugasRows.map(t => t.id_Tugas)

    const { data: submissions, error: subError } = await supabaseAdmin
      .from('Pengumpulan_Tugas')
      .select('id_Tugas, id_User, nilai')
      .eq('id_User', userId)
      .in('id_Tugas', tugasIds)

    if (subError) return res.status(500).json({ error: subError.message })

    const submittedMap = new Map()
    ;(submissions || []).forEach(s => {
      submittedMap.set(s.id_Tugas, s)
    })

    const result = (tugasRows || []).map(t => {
      const sub = submittedMap.get(t.id_Tugas)
      return {
        ...t,
        sudah_dikumpulkan: !!sub,
        sudah_dinilai: sub ? sub.nilai !== null && sub.nilai !== undefined : false,
        nilai: sub?.nilai ?? null
      }
    })

    return res.status(200).json({ tugas: result })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
