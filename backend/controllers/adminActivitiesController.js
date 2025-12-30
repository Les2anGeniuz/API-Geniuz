import { supabaseAdmin } from '../services/supabase.js';

export const getAdminActivities = async (req, res) => {
  try {
    // Ambil 10 aktivitas terbaru dari tabel Pengumpulan_Tugas dan Materi
    const [tugas, materi] = await Promise.all([
      supabaseAdmin
        .from('Pengumpulan_Tugas')
        .select('id_User, id_Kelas, tanggal_submit, nilai, User(nama_lengkap), Kelas(nama_kelas)')
        .order('tanggal_submit', { ascending: false })
        .limit(5),
      supabaseAdmin
        .from('Materi')
        .select('id_Materi, id_Kelas, judul_materi, Tanggal_tayang, Kelas(nama_kelas)')
        .order('Tanggal_tayang', { ascending: false })
        .limit(5),
    ]);

    const aktivitas = [];
    if (tugas.data) {
      aktivitas.push(...tugas.data.map((t) => ({
        title: 'Pengumpulan Tugas',
        desc: `User ${t.User?.nama_lengkap || t.id_User} mengumpulkan tugas di kelas ${t.Kelas?.nama_kelas || t.id_Kelas}`,
        time: t.tanggal_submit,
      })));
    }
    if (materi.data) {
      aktivitas.push(...materi.data.map((m) => ({
        title: 'Materi Baru',
        desc: `Materi "${m.judul_materi}" tayang di kelas ${m.Kelas?.nama_kelas || m.id_Kelas}`,
        time: m.Tanggal_tayang,
      })));
    }
    // Urutkan aktivitas terbaru
    aktivitas.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json({ data: aktivitas.slice(0, 10) });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Internal server error' });
  }
};