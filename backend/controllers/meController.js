import { supabaseAdmin } from '../services/supabase.js'

export const getMyKelas = async (req, res) => {
  try {
    const userId = req.user?.id_User
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { data: pendaftarans, error: daftarError } = await supabaseAdmin
      .from('Pendaftaran')
      .select('id_Pendaftaran, id_Kelas, status_pendaftaran, tanggal_pendaftaran')
      .eq('id_User', userId)
      .order('tanggal_pendaftaran', { ascending: false })

    if (daftarError) return res.status(500).json({ error: daftarError.message })
    if (!pendaftarans || !pendaftarans.length) return res.status(200).json({ kelas: [] })

    const kelasIds = [...new Set(pendaftarans.map(p => p.id_Kelas).filter(Boolean))]
    const { data: kelasRows, error: kelasError } = await supabaseAdmin
      .from('Kelas')
      .select('id_Kelas, id_Fakultas, id_Mentor, nama_kelas, deskripsi')
      .in('id_Kelas', kelasIds)

    if (kelasError) return res.status(500).json({ error: kelasError.message })

    const fakultasIds = [...new Set((kelasRows || []).map(k => k.id_Fakultas).filter(Boolean))]
    const mentorIds = [...new Set((kelasRows || []).map(k => k.id_Mentor).filter(Boolean))]

    const { data: fakultasRows, error: fakultasError } = await supabaseAdmin
      .from('Fakultas')
      .select('id_Fakultas, nama_fakultas, deskripsi_fakultas')
      .in('id_Fakultas', fakultasIds)

    if (fakultasError) return res.status(500).json({ error: fakultasError.message })

    const { data: mentorRows, error: mentorError } = await supabaseAdmin
      .from('Mentor')
      .select('id_Mentor, id_Fakultas, nama_mentor, deskripsi, email, status')
      .in('id_Mentor', mentorIds)

    if (mentorError) return res.status(500).json({ error: mentorError.message })

    const kelasMap = new Map(); (kelasRows || []).forEach(k => kelasMap.set(k.id_Kelas, k))
    const fakultasMap = new Map(); (fakultasRows || []).forEach(f => fakultasMap.set(f.id_Fakultas, f))
    const mentorMap = new Map(); (mentorRows || []).forEach(m => mentorMap.set(m.id_Mentor, m))

    const result = pendaftarans.map(p => {
      const kelas = p.id_Kelas ? kelasMap.get(p.id_Kelas) || null : null
      const fakultas = kelas?.id_Fakultas ? fakultasMap.get(kelas.id_Fakultas) || null : null
      const mentor = kelas?.id_Mentor ? mentorMap.get(kelas.id_Mentor) || null : null

      return {
        id_Pendaftaran: p.id_Pendaftaran,
        status_pendaftaran: p.status_pendaftaran,
        tanggal_pendaftaran: p.tanggal_pendaftaran,
        kelas,
        fakultas,
        mentor
      }
    })

    return res.status(200).json({ kelas: result })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id_User
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

 
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('id_User, nama_lengkap, email, foto_profil')
      .eq('id_User', userId)
      .single()

    if (userError) return res.status(500).json({ error: userError.message })

    const { data: pendaftaran } = await supabaseAdmin
      .from('Pendaftaran')
      .select('Instansi, Jurusan')
      .eq('id_User', userId)
      .order('tanggal_pendaftaran', { ascending: false })
      .limit(1)
      .single()

    return res.status(200).json({
      ...user,
      nama_universitas: pendaftaran?.Instansi || 'Belum Diatur',
      nama_fakultas: pendaftaran?.Jurusan || 'Belum Diatur'
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id_User
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

 
    const { email, foto_profil, nama_lengkap } = req.body 

    const { data, error } = await supabaseAdmin
      .from('User')
      .update({ 
        email, 
        foto_profil, 
        nama_lengkap 
      })
      .eq('id_User', userId)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ message: 'Profil diperbarui' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}