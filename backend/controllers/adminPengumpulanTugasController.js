// backend/controllers/adminPengumpulanTugasController.js
import { supabaseAdmin } from "../services/supabase.js";

// GET /admin/tugas/:idTugas/pengumpulan
async function getPengumpulanTugas(req, res) {
  const { idTugas } = req.params;
  if (!idTugas) return res.status(400).json({ error: "idTugas is required" });

  // Query Pengumpulan_Tugas joined with User and Tugas
  const { data, error } = await supabaseAdmin
    .from("Pengumpulan_Tugas")
    .select(`*, User(*), Tugas(judul_tugas)`) // join User and Tugas
    .eq("id_Tugas", idTugas)
    .order("tanggal_submit", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}


// POST /admin/tugas/:idTugas/pengumpulan/:idPengumpulan/nilai
async function updateNilaiPengumpulanTugas(req, res) {
  const { idPengumpulan } = req.params;
  const { nilai } = req.body;
  if (!idPengumpulan || typeof nilai === 'undefined') {
    return res.status(400).json({ error: "idPengumpulan dan nilai wajib diisi" });
  }
  // Update nilai pada Pengumpulan_Tugas
  const { error } = await supabaseAdmin
    .from("Pengumpulan_Tugas")
    .update({ nilai })
    .eq("id_Pengumpulan", idPengumpulan);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

export { getPengumpulanTugas, updateNilaiPengumpulanTugas };
