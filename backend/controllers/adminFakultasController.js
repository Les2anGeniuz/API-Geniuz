import { supabaseAdmin } from '../services/supabase.js'

export const getAllFakultas = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('Fakultas')
      .select('id_Fakultas, nama_fakultas, deskripsi_fakultas, created_at')
      .order('id_Fakultas', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ fakultas: data || [] })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const createFakultas = async (req, res) => {
  try {
    const { nama_fakultas, deskripsi_fakultas } = req.body

    if (!nama_fakultas) {
      return res.status(400).json({ error: 'nama_fakultas is required' })
    }

    const { data, error } = await supabaseAdmin
      .from('Fakultas')
      .insert([{ nama_fakultas, deskripsi_fakultas }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json({ fakultas: data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const updateFakultas = async (req, res) => {
  try {
    const { id } = req.params
    const { nama_fakultas, deskripsi_fakultas } = req.body

    const { data, error } = await supabaseAdmin
      .from('Fakultas')
      .update({ nama_fakultas, deskripsi_fakultas })
      .eq('id_Fakultas', id)
      .select()
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Fakultas not found' })
    }

    return res.status(200).json({ fakultas: data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const deleteFakultas = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('Fakultas')
      .delete()
      .eq('id_Fakultas', id)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ message: 'Fakultas deleted' })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
