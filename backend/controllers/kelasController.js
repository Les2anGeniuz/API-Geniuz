import { supabaseAdmin } from '../services/supabase.js'

// 1. Mengambil semua daftar kelas (untuk Dashboard Utama)
export const getAllKelas = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('Kelas')
      .select('id_Kelas, id_Fakultas, id_Mentor, nama_kelas, deskripsi')
      .order('id_Kelas', { ascending: true })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ data: data || [] })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

// 2. Mengambil Detail Kelas (Materi + Tugas) berdasarkan ID Kelas
export const getKelasDetail = async (req, res) => {
  try {
    const { id } = req.params
    const idNum = Number(id)

    if (!idNum || Number.isNaN(idNum)) {
      return res.status(400).json({ error: 'ID kelas tidak valid' })
    }

    // Ambil data dasar Kelas terlebih dahulu
    const { data: kelasRow, error: kelasError } = await supabaseAdmin
      .from('Kelas')
      .select('id_Kelas, id_Fakultas, id_Mentor, nama_kelas, deskripsi')
      .eq('id_Kelas', idNum)
      .single()

    if (kelasError) {
      if (kelasError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Kelas tidak ditemukan' })
      }
      return res.status(500).json({ error: kelasError.message })
    }

    // Ambil Materi & Tugas secara paralel untuk efisiensi performa
    const [materiRes, tugasRes] = await Promise.all([
      supabaseAdmin
        .from('Materi')
        .select('id_Materi, id_Kelas, judul_materi, Tanggal_tayang, tipe_konten, thumbnail_url, urutan')
        .eq('id_Kelas', idNum)
        .order('urutan', { ascending: true }),
      supabaseAdmin
        .from('Tugas')
        .select('id_Tugas, id_Kelas, judul_tugas, deskripsi, tenggat_waktu, status')
        .eq('id_Kelas', idNum)
        .order('tenggat_waktu', { ascending: true })
    ])

    if (materiRes.error) return res.status(500).json({ error: materiRes.error.message })
    if (tugasRes.error) return res.status(500).json({ error: tugasRes.error.message })

    // Gabungkan data dalam satu objek response
    return res.status(200).json({
      data: {
        ...kelasRow,
        Materi: materiRes.data || [],
        Tugas: tugasRes.data || [],
      }
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

// 3. Mengambil semua Kelas di dalam sebuah Fakultas (dengan nested Materi & Tugas)
export const getKelasByFakultas = async (req, res) => {
  try {
    const { id } = req.params
    const idNum = Number(id)
    if (!idNum || Number.isNaN(idNum)) {
      return res.status(400).json({ error: 'id fakultas tidak valid' })
    }

    const { data, error } = await supabaseAdmin
      .from('Fakultas')
      .select(`
        id_Fakultas,
        nama_fakultas,
        Kelas (
          id_Kelas,
          nama_kelas,
          deskripsi,
          Materi (
            id_Materi,
            judul_materi,
            Tanggal_tayang,
            tipe_konten,
            thumbnail_url,
            urutan
          ),
          Tugas (
            id_Tugas,
            judul_tugas,
            status,
            tenggat_waktu
          )
        )
      `)
      .eq('id_Fakultas', idNum)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Fakultas not found' })
      }
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ data: data })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}