import { supabaseAdmin } from '../services/supabase.js'

export const getAllFakultas = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('Fakultas')
      .select('id_Fakultas, nama_fakultas, deskripsi_fakultas, created_at')
      .order('id_Fakultas', { ascending: true })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ fakultas: data || [] })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getFakultasById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('Fakultas')
      .select('id_Fakultas, nama_fakultas, deskripsi_fakultas, created_at')
      .eq('id_Fakultas', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Fakultas not found' })
      }
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ fakultas: data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
