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

export const createMentor = async (req, res) => {
  try {
    const { id_Fakultas, nama_mentor, deskripsi, email, status } = req.body

    if (!id_Fakultas || !nama_mentor) {
      return res.status(400).json({ error: 'id_Fakultas and nama_mentor are required' })
    }

    const { data, error } = await supabaseAdmin
      .from('Mentor')
      .insert([{ id_Fakultas, nama_mentor, deskripsi, email, status }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json({ mentor: data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const updateMentor = async (req, res) => {
  try {
    const { id } = req.params
    const { id_Fakultas, nama_mentor, deskripsi, email, status } = req.body

    const { data, error } = await supabaseAdmin
      .from('Mentor')
      .update({ id_Fakultas, nama_mentor, deskripsi, email, status })
      .eq('id_Mentor', id)
      .select()
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Mentor not found' })
    }

    return res.status(200).json({ mentor: data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const deleteMentor = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('Mentor')
      .delete()
      .eq('id_Mentor', id)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ message: 'Mentor deleted' })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
