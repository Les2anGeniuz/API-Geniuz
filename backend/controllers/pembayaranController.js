import { supabaseAdmin } from '../services/supabase.js'

export const createPembayaran = async (req, res) => {
  const userId = req.user.id_User
  const { id_Pendaftaran, jumlah_bayar, metode_pembayaran } = req.body

  const { data: daftar, error: daftarError } = await supabaseAdmin
    .from('Pendaftaran')
    .select('*')
    .eq('id_Pendaftaran', id_Pendaftaran)
    .eq('id_User', userId)
    .single()

  if (daftarError || !daftar) return res.status(400).json({ error: 'Pendaftaran tidak valid' })

  const { data, error } = await supabaseAdmin
    .from('Pembayaran')
    .insert([
      {
        id_Pendaftaran,
        jumlah_bayar,
        metode_pembayaran,
        status_pembayaran: 'berhasil'
      }
    ])
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  await supabaseAdmin
    .from('Pendaftaran')
    .update({ status_pendaftaran: 'aktif' })
    .eq('id_Pendaftaran', id_Pendaftaran)

  return res.status(201).json({ pembayaran: data })
}

export const getPembayaranByPendaftaran = async (req, res) => {
  const userId = req.user.id_User
  const id_Pendaftaran = req.params.idPendaftaran

  const { data: daftar, error: daftarError } = await supabaseAdmin
    .from('Pendaftaran')
    .select('*')
    .eq('id_Pendaftaran', id_Pendaftaran)
    .eq('id_User', userId)
    .single()

  if (daftarError || !daftar) return res.status(400).json({ error: 'Pendaftaran tidak valid' })

  const { data, error } = await supabaseAdmin
    .from('Pembayaran')
    .select('*')
    .eq('id_Pendaftaran', id_Pendaftaran)
    .single()

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ pembayaran: data })
}
