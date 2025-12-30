// Update pendaftaran by id
export const updatePendaftaran = async (req, res) => {
  try {
    const { id } = req.params;
    // Hanya field yang diizinkan
    const allowed = [
      'Domisili', 'Jurusan', 'Semester', 'Instansi', 'Tanggal_Lahir', 'status_pendaftaran', 'id_Fakultas'
    ];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'Tidak ada field untuk diupdate' });
    }
    const { data, error } = await supabaseAdmin
      .from('Pendaftaran')
      .update(patch)
      .eq('id_Pendaftaran', id)
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ data });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal server error' });
  }
};
import { supabaseAdmin } from '../services/supabase.js'

export const createPendaftaran = async (req, res) => {
  const userId = req.user.id_User
  const {
    id_Fakultas,
    domisili,
    tanggal_lahir,
    jurusan,
    semester,
    instansi,
    nama_lengkap,
    email
  } = req.body

  if (!id_Fakultas) {
    return res.status(400).json({ error: 'id_Fakultas wajib diisi' })
  }

  const { data, error } = await supabaseAdmin
    .from('Pendaftaran')
    .insert([
      {
        id_User: userId,
        id_Fakultas: id_Fakultas,
        Domisili: domisili,
        Tanggal_Lahir: tanggal_lahir,
        Jurusan: jurusan,
        Semester: semester,
        Instansi: instansi,
        Nama_Lengkap: nama_lengkap,
        Email: email,
        status_pendaftaran: 'pending'
      }
    ])
    .select()
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(201).json({ pendaftaran: data })
}

export const getMyPendaftarans = async (req, res) => {
  const userId = req.user.id_User

  const { data, error } = await supabaseAdmin
    .from('Pendaftaran')
    .select('*')
    .eq('id_User', userId)

  if (error) return res.status(400).json({ error: error.message })
  return res.status(200).json({ pendaftaran: data })
}
