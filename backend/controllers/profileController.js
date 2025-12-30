import { supabaseAdmin } from '../services/supabase.js'

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id_User
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { data: userRow, error: userError } = await supabaseAdmin
      .from('User')
      .select('id_User, nama_lengkap, email, created_at')
      .eq('id_User', userId)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      return res.status(500).json({ error: userError.message })
    }

    const { data: pendaftarans, error: daftarError } = await supabaseAdmin
      .from('Pendaftaran')
      .select('id_Pendaftaran, Domisili, Tanggal_Lahir, Jurusan, Semester, Instansi, Nama_Lengkap, Email, tanggal_pendaftaran')
      .eq('id_User', userId)
      .order('tanggal_pendaftaran', { ascending: false })

    if (daftarError) {
      return res.status(500).json({ error: daftarError.message })
    }

    const biodata = pendaftarans && pendaftarans.length ? pendaftarans[0] : null

    return res.status(200).json({
      user: userRow || null,
      biodata
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id_User
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { nama_lengkap, domisili, tanggal_lahir, jurusan, semester, instansi } = req.body

    if (nama_lengkap) {
      const { error: userUpdateError } = await supabaseAdmin
        .from('User')
        .update({ nama_lengkap })
        .eq('id_User', userId)

      if (userUpdateError) {
        return res.status(500).json({ error: userUpdateError.message })
      }
    }

    const { data: pendaftarans, error: daftarError } = await supabaseAdmin
      .from('Pendaftaran')
      .select('id_Pendaftaran')
      .eq('id_User', userId)
      .order('tanggal_pendaftaran', { ascending: false })

    if (daftarError) {
      return res.status(500).json({ error: daftarError.message })
    }

    const latest = pendaftarans && pendaftarans.length ? pendaftarans[0] : null

    if (latest) {
      const updateFields = {}
      if (domisili !== undefined) updateFields.Domisili = domisili
      if (tanggal_lahir !== undefined) updateFields.Tanggal_Lahir = tanggal_lahir
      if (jurusan !== undefined) updateFields.Jurusan = jurusan
      if (semester !== undefined) updateFields.Semester = semester
      if (instansi !== undefined) updateFields.Instansi = instansi
      if (nama_lengkap !== undefined) updateFields.Nama_Lengkap = nama_lengkap

      if (Object.keys(updateFields).length > 0) {
        const { error: biodataError } = await supabaseAdmin
          .from('Pendaftaran')
          .update(updateFields)
          .eq('id_Pendaftaran', latest.id_Pendaftaran)

        if (biodataError) {
          return res.status(500).json({ error: biodataError.message })
        }
      }
    }

    const { data: userRow, error: userError } = await supabaseAdmin
      .from('User')
      .select('id_User, nama_lengkap, email, created_at')
      .eq('id_User', userId)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      return res.status(500).json({ error: userError.message })
    }

    const { data: biodataRows, error: biodataFetchError } = await supabaseAdmin
      .from('Pendaftaran')
      .select('id_Pendaftaran, Domisili, Tanggal_Lahir, Jurusan, Semester, Instansi, Nama_Lengkap, Email, tanggal_pendaftaran')
      .eq('id_User', userId)
      .order('tanggal_pendaftaran', { ascending: false })

    if (biodataFetchError) {
      return res.status(500).json({ error: biodataFetchError.message })
    }

    const biodata = biodataRows && biodataRows.length ? biodataRows[0] : null

    return res.status(200).json({
      user: userRow || null,
      biodata
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
