import { supabaseAdmin } from '../services/supabase.js'

export const getMyProgress = async (req, res) => {
  try {
    const userId = req.user?.id_User
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { data: progressRows, error: progressError } = await supabaseAdmin
      .from('Progress')
      .select('id_Progress, id_User, id_Kelas, Total_tugas, Tugas_Selesai, Prsentase_Progress, Last_update')
      .eq('id_User', userId)

    if (progressError) return res.status(500).json({ error: progressError.message })

    if (!progressRows || !progressRows.length) {
      return res.status(200).json({ progress: [] })
    }

    const kelasIds = [...new Set(progressRows.map(p => p.id_Kelas).filter(Boolean))]

    let kelasMap = new Map()
    if (kelasIds.length) {
      const { data: kelasRows, error: kelasError } = await supabaseAdmin
        .from('Kelas')
        .select('id_Kelas, id_Fakultas, id_Mentor, nama_kelas, deskripsi')
        .in('id_Kelas', kelasIds)

      if (kelasError) return res.status(500).json({ error: kelasError.message })

      kelasMap = new Map()
      ;(kelasRows || []).forEach(k => {
        kelasMap.set(k.id_Kelas, k)
      })
    }

    const result = progressRows.map(p => ({
      id_Progress: p.id_Progress,
      id_User: p.id_User,
      id_Kelas: p.id_Kelas,
      total_tugas: p.Total_tugas,
      tugas_selesai: p.Tugas_Selesai,
      persentase_progress: Number(p.Prsentase_Progress || 0),
      last_update: p.Last_update,
      kelas: p.id_Kelas ? kelasMap.get(p.id_Kelas) || null : null
    }))

    return res.status(200).json({ progress: result })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getMyProgressByKelas = async (req, res) => {
  try {
    const userId = req.user?.id_User
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { id } = req.params

    const { data: row, error: progressError } = await supabaseAdmin
      .from('Progress')
      .select('id_Progress, id_User, id_Kelas, Total_tugas, Tugas_Selesai, Prsentase_Progress, Last_update')
      .eq('id_User', userId)
      .eq('id_Kelas', id)
      .single()

    if (progressError) {
      if (progressError.code === 'PGRST116') {
        return res.status(200).json({ progress: null })
      }
      return res.status(500).json({ error: progressError.message })
    }

    const { data: kelasRow, error: kelasError } = await supabaseAdmin
      .from('Kelas')
      .select('id_Kelas, id_Fakultas, id_Mentor, nama_kelas, deskripsi')
      .eq('id_Kelas', id)
      .single()

    if (kelasError && kelasError.code !== 'PGRST116') {
      return res.status(500).json({ error: kelasError.message })
    }

    const result = {
      id_Progress: row.id_Progress,
      id_User: row.id_User,
      id_Kelas: row.id_Kelas,
      total_tugas: row.Total_tugas,
      tugas_selesai: row.Tugas_Selesai,
      persentase_progress: Number(row.Prsentase_Progress || 0),
      last_update: row.Last_update,
      kelas: kelasRow || null
    }

    return res.status(200).json({ progress: result })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
