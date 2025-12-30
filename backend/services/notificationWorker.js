import cron from 'node-cron';
import { supabaseAdmin } from './supabase.js';

// Fungsi untuk mengecek deadline tugas
const checkDeadlines = async () => {
  try {
    console.log('--- Sistem sedang mengecek deadline tugas ---');

    const sekarang = new Date();
    const besok = new Date(sekarang.getTime() + 24 * 60 * 60 * 1000);

    const { data: tugasMepet, error: errorTugas } = await supabaseAdmin
      .from('Tugas')
      .select(`id_Tugas, judul_tugas, tenggat_waktu, id_Kelas`)
      .gt('tenggat_waktu', sekarang.toISOString())
      .lt('tenggat_waktu', besok.toISOString());

    if (errorTugas) throw errorTugas;

    if (tugasMepet && tugasMepet.length > 0) {
      for (const tugas of tugasMepet) {
        console.log(`📌 Mengecek tugas: ${tugas.judul_tugas} (ID: ${tugas.id_Tugas})`);
        
        const { data: infoKelas, error: errorKelas } = await supabaseAdmin
          .from('Kelas')
          .select('id_Fakultas')
          .eq('id_Kelas', tugas.id_Kelas)
          .single();

        if (errorKelas || !infoKelas) {
          console.error(`❌ Gagal dapat info fakultas untuk kelas ${tugas.id_Kelas}`);
          continue; 
        }

        const { data: siswaList, error: errorSiswa } = await supabaseAdmin
          .from('Pendaftaran')
          .select('id_User')
          .eq('id_Fakultas', infoKelas.id_Fakultas);

        if (errorSiswa) {
          console.error(`❌ Gagal ambil siswa di fakultas ${infoKelas.id_Fakultas}`);
          continue;
        }

        // LOG: Lihat siapa saja yang ditarik dari tabel Pendaftaran
        console.log(`👥 Daftar siswa di fakultas ${infoKelas.id_Fakultas}:`, siswaList?.map(s => s.id_User));

        if (siswaList && siswaList.length > 0) {
          for (const siswa of siswaList) {
            console.log(`🔍 Memproses siswa ID: ${siswa.id_User}`);
            
            // Cek Pengumpulan
            const { data: sudahKumpul } = await supabaseAdmin
              .from('Pengumpulan_Tugas')
              .select('id_Pengumpulan')
              .eq('id_Tugas', tugas.id_Tugas)
              .eq('id_User', siswa.id_User)
              .maybeSingle();

            if (sudahKumpul) {
              console.log(`⏩ Siswa ${siswa.id_User} SKIP: Sudah mengumpulkan.`);
              continue;
            }

            // Cek Anti-Spam (Notif hari ini)
            const { data: notifAda } = await supabaseAdmin
              .from('Notifikasi')
              .select('id_Notif')
              .eq('id_User', siswa.id_User)
              .eq('judul', '🚨 Deadline Mepet!')
              .eq('tipe', 'deadline')
              .gte('tanggal', sekarang.toISOString().split('T')[0]);

            if (notifAda && notifAda.length > 0) {
              console.log(`⏩ Siswa ${siswa.id_User} SKIP: Notif sudah dikirim hari ini.`);
              continue;
            }

            // Jika lolos semua pengecekan
            const { error: errorInsert } = await supabaseAdmin
              .from('Notifikasi')
              .insert([{
                id_User: siswa.id_User,
                judul: '🚨 Deadline Mepet!',
                pesan: `Tugas "${tugas.judul_tugas}" akan berakhir dalam kurang dari 24 jam. Yuk segera selesaikan!`,
                tipe: 'deadline',
                status_baca: false
              }]);

            if (!errorInsert) {
              console.log(`✅ SUCCESS: Notifikasi deadline dikirim ke ID: ${siswa.id_User}`);
            } else {
              console.error(`❌ ERROR: Gagal insert notif ke ${siswa.id_User}:`, errorInsert.message);
            }
          }
        }
      }
    } else {
      console.log('☁️ Tidak ada tugas mepet (H-1) saat ini.');
    }
  } catch (err) {
    console.error('💥 Worker Deadline Error:', err.message);
  }
};

cron.schedule('* * * * *', checkDeadlines);
export default checkDeadlines;