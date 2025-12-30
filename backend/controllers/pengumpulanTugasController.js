import { supabaseAdmin } from '../services/supabase.js'

export const getMySubmissionForTugas = async (req, res) => {
  try {
    const userId = req.user?.id_User
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('Pengumpulan_Tugas')
      .select('id_Pengumpulan, id_Kelas, id_Tugas, id_User, file_pengumpulan, tanggal_submit, nilai')
      .eq('id_User', userId)
      .eq('id_Tugas', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return res.status(200).json({ submission: null })
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ submission: data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const submitTugas = async (req, res) => {
  try {
    const userId = req.user?.id_User
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { id } = req.params
    const { id_Kelas, file_pengumpulan } = req.body

    if (!id_Kelas || !file_pengumpulan) {
      return res.status(400).json({ error: 'id_Kelas and file_pengumpulan are required' })
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('Pengumpulan_Tugas')
      .select('id_Pengumpulan')
      .eq('id_User', userId)
      .eq('id_Tugas', id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      return res.status(500).json({ error: existingError.message })
    }

    const now = new Date().toISOString()

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('Pengumpulan_Tugas')
        .update({
          id_Kelas,
          file_pengumpulan,
          tanggal_submit: now
        })
        .eq('id_Pengumpulan', existing.id_Pengumpulan)
        .select('id_Pengumpulan, id_Kelas, id_Tugas, id_User, file_pengumpulan, tanggal_submit, nilai')
        .single()

      if (error) return res.status(500).json({ error: error.message })

      return res.status(200).json({ submission: data })
    }

    const { data, error } = await supabaseAdmin
      .from('Pengumpulan_Tugas')
      .insert([
        {
          id_Kelas,
          id_Tugas: Number(id),
          id_User: userId,
          file_pengumpulan,
          tanggal_submit: now,
          nilai: null
        }
      ])
      .select('id_Pengumpulan, id_Kelas, id_Tugas, id_User, file_pengumpulan, tanggal_submit, nilai')
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json({ submission: data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
