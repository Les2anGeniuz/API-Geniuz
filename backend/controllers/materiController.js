import { supabaseAdmin } from '../services/supabase.js'

const materiSelect =
  'id_Materi, id_Kelas, judul_materi, deskripsi, tipe_konten, link_konten, urutan, Tanggal_tayang, thumbnail_url'

function toInt(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export const getMateriByKelas = async (req, res) => {
  try {
    const id = toInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id_Kelas' })

    const { data, error } = await supabaseAdmin
      .from('Materi')
      .select(materiSelect)
      .eq('id_Kelas', id)
      .order('urutan', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ data: data || [] })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getMateriById = async (req, res) => {
  try {
    const id = toInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid id_Materi' })

    const { data, error } = await supabaseAdmin
      .from('Materi')
      .select(materiSelect)
      .eq('id_Materi', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Materi not found' })
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getMateri = async (req, res) => {
  try {
    const idKelas = toInt(req.query.id_Kelas)
    const idMateri = toInt(req.query.id_Materi)

    if (!idKelas && !idMateri) {
      return res.status(400).json({ error: 'Provide id_Kelas or id_Materi' })
    }

    if (idMateri) {
      const { data, error } = await supabaseAdmin
        .from('Materi')
        .select(materiSelect)
        .eq('id_Materi', idMateri)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return res.status(404).json({ error: 'Materi not found' })
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ data })
    }

    const { data, error } = await supabaseAdmin
      .from('Materi')
      .select(materiSelect)
      .eq('id_Kelas', idKelas)
      .order('urutan', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ data: data || [] })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
