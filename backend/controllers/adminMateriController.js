import { supabaseAdmin } from '../services/supabase.js'

const SELECT_MATERI = `
  id_Materi,
  id_Kelas,
  judul_materi,
  deskripsi,
  tipe_konten,
  link_konten,
  urutan,
  Tanggal_tayang,
  thumbnail_url,
  Kelas (
    id_Kelas,
    nama_kelas
  )
`

export const listAdminMateri = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.max(1, Number(req.query.limit || 10))
    const offset = (page - 1) * limit
    const id_Kelas = req.query.id_Kelas || null

    let q = supabaseAdmin
      .from('Materi')
      .select(SELECT_MATERI, { count: 'exact' })
      .order('urutan', { ascending: true })
      .range(offset, offset + limit - 1)

    if (id_Kelas) {
      const idNum = Number(id_Kelas)
      const idStr = String(id_Kelas)
      q = q.or(`id_Kelas.eq.${idNum},id_Kelas.eq.${idStr}`)
    }

    const { data, error, count } = await q
    if (error) return res.status(500).json({ error: error.message })

    const idNum = id_Kelas ? Number(id_Kelas) : null
    const idStr = id_Kelas ? String(id_Kelas) : null
    const filtered = id_Kelas
      ? (data || []).filter(m => Number(m.id_Kelas) === idNum || String(m.id_Kelas) === idStr)
      : data

    return res.json({
      data: filtered,
      meta: {
        page,
        limit,
        total: count,
        totalPage: Math.ceil(count / limit)
      }
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

export const getAdminMateriById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('Materi')
      .select(SELECT_MATERI)
      .eq('id_Materi', id)
      .single()

    if (error) return res.status(404).json({ error: 'Materi tidak ditemukan' })
    return res.json(data)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

export const createAdminMateri = async (req, res) => {
  try {
    const {
      id_Kelas,
      judul_materi,
      deskripsi,
      tipe_konten,
      link_konten,
      urutan,
      Tanggal_tayang,
      thumbnail_url
    } = req.body

    if (!id_Kelas || !judul_materi) {
      return res.status(400).json({ error: 'id_Kelas dan judul_materi wajib' })
    }

    const { data, error } = await supabaseAdmin
      .from('Materi')
      .insert([{
        id_Kelas,
        judul_materi,
        deskripsi,
        tipe_konten,
        link_konten,
        urutan,
        Tanggal_tayang,
        thumbnail_url
      }])
      .select(SELECT_MATERI)
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json(data)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

export const updateAdminMateri = async (req, res) => {
  try {
    const { id } = req.params
    const payload = req.body

    const { data, error } = await supabaseAdmin
      .from('Materi')
      .update(payload)
      .eq('id_Materi', id)
      .select(SELECT_MATERI)
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json(data)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

export const deleteAdminMateri = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('Materi')
      .delete()
      .eq('id_Materi', id)

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
