import { supabaseAdmin } from '../services/supabase.js'

export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('Admin')
      .select('id, nama, email')
      .eq('id', id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Admin tidak ditemukan' })
    }

    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getAdminMe = async (req, res) => {
  try {
    const adminId = req.admin?.adminId
    if (!adminId) return res.status(401).json({ error: 'Unauthorized' })

    const { data, error } = await supabaseAdmin
      .from('Admin')
      .select('id, nama, email')
      .eq('id', adminId)
      .single()

    if (error || !data) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
