import { supabaseAdmin } from '../services/supabase.js';


// 2. FUNGSI INTERNAL BUAT NOTIFIKASI (Anti-Duplikat)
export const createNotifikasi = async (userId, judul, pesan) => {
  try {
    // Cek apakah notif yang sama persis sudah pernah dikirim
    const { data: existingNotif, error: checkError } = await supabaseAdmin
      .from('Notifikasi')
      .select('id_Notif')
      .eq('id_User', userId)
      .eq('judul', judul)
      .eq('pesan', pesan)
      .maybeSingle();

    if (checkError) console.error('Error saat cek notif:', checkError.message);

    if (existingNotif) {
      return { success: true, message: `⏭️ SKIP: User ${userId} sudah dapet notif ini.` };
    }

    // Jika belum ada, baru insert
    const { data, error } = await supabaseAdmin
      .from('Notifikasi')
      .insert([
        { 
          id_User: userId, 
          judul: judul, 
          pesan: pesan,
          status_baca: false
        }
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (e) {
    console.error('❌ Gagal simpan notif ke DB:', e.message);
    return { success: false, error: e.message };
  }
};

// 3. FUNGSI AMBIL NOTIFIKASI (Untuk Siswa)
export const getMyNotifikasi = async (req, res) => {
  try {
    const userId = req.user?.id_User;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabaseAdmin
      .from('Notifikasi')
      .select('*')
      .eq('id_User', userId)
      .order('id_Notif', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ notifications: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// 4. FUNGSI TANDAI SUDAH BACA
export const markAsRead = async (req, res) => {
  try {
    const { id_Notif } = req.params;
    const { error } = await supabaseAdmin
      .from('Notifikasi')
      .update({ status_baca: true })
      .eq('id_Notif', id_Notif);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Notifikasi diperbarui' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};