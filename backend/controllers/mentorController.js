import { supabaseAdmin } from '../services/supabase.js'

export const getAllMentor = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('Mentor')
      .select('id_Mentor, id_Fakultas, nama_mentor, deskripsi, email, status')
      .order('id_Mentor', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ mentor: data || [] })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getMentorById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('Mentor')
      .select('id_Mentor, id_Fakultas, nama_mentor, deskripsi, email, status')
      .eq('id_Mentor', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Mentor not found' })
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ mentor: data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getMentorByFakultas = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('Mentor')
      .select('id_Mentor, id_Fakultas, nama_mentor, deskripsi, email, status')
      .eq('id_Fakultas', id)
      .order('id_Mentor', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ mentor: data || [] })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
