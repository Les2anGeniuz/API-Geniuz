// backend/controllers/adminAnalyticsController.js
import { supabaseAnon, supabaseAdmin } from "../services/supabase.js";

// =========================
// Helpers
// =========================
function toISODate(d) {
  return new Date(d).toISOString();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(start, end) {
  const a = new Date(start);
  const b = new Date(end);
  const ms = b.getTime() - a.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function calcDeltaPct(current, previous) {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function isCompletedProgress(p) {
  const total = Number(p.Total_tugas ?? 0);
  const done = Number(p.Tugas_Selesai ?? 0);
  const pct =
    p.Prsentase_Progress === null || p.Prsentase_Progress === undefined
      ? null
      : Number(p.Prsentase_Progress);

  if (total > 0) return done >= total;
  if (pct !== null) return pct >= 100;
  return false;
}

function progressValuePct(p) {
  const total = Number(p.Total_tugas ?? 0);
  const done = Number(p.Tugas_Selesai ?? 0);
  const pct =
    p.Prsentase_Progress === null || p.Prsentase_Progress === undefined
      ? null
      : Number(p.Prsentase_Progress);

  if (total > 0) return Math.max(0, Math.min(100, (done / total) * 100));
  if (pct !== null) return Math.max(0, Math.min(100, pct));
  return 0;
}

// =========================
// Charts (Monthly)
// =========================

// Siswa baru per bulan untuk bar chart
export const newStudentsMonthly = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const months = monthNames.map((m) => `${m} ${year}`);

    // Ambil semua pendaftaran tahun ini
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const { data, error } = await supabaseAdmin
      .from("Pendaftaran")
      .select("id_Pendaftaran, tanggal_pendaftaran")
      .gte("tanggal_pendaftaran", start.toISOString())
      .lt("tanggal_pendaftaran", end.toISOString());

    if (error) return res.status(500).json({ error: error.message });

    const monthly = Array(12).fill(0);
    (data || []).forEach((row) => {
      const date = new Date(row.tanggal_pendaftaran);
      if (date.getFullYear() === year) {
        monthly[date.getMonth()] += 1;
      }
    });

    return res.json({ months, counts: monthly });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Internal server error" });
  }
};

// Revenue bulanan untuk line chart
export const revenueMonthly = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const months = monthNames.map((m) => `${m} ${year}`);

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const { data, error } = await supabaseAdmin
      .from("Pembayaran")
      .select("jumlah_bayar, tanggal_bayar, status_pembayaran")
      .eq("status_pembayaran", "berhasil")
      .gte("tanggal_bayar", start.toISOString())
      .lt("tanggal_bayar", end.toISOString());

    if (error) return res.status(500).json({ error: error.message });

    const monthly = Array(12).fill(0);
    (data || []).forEach((row) => {
      const date = new Date(row.tanggal_bayar);
      if (date.getFullYear() === year) {
        monthly[date.getMonth()] += Number(row.jumlah_bayar || 0);
      }
    });

    return res.json({ months, revenues: monthly });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Internal server error" });
  }
};

// =========================
// Admin Analytics (Dashboard)
// =========================

export async function getAdminAnalytics(req, res) {
  try {
    console.log("[getAdminAnalytics] called", { time: new Date().toISOString() });

    const adminId = req.user?.adminId;
    console.log("[getAdminAnalytics] adminId from JWT:", adminId);

    if (!adminId) {
      console.warn("[getAdminAnalytics] Tidak ada adminId di JWT!");
      return res.status(401).json({ error: "Unauthorized: adminId missing" });
    }

    // Validasi adminId (pakai service role biar aman)
    const { data: admin, error: adminError } = await supabaseAdmin
      .from("Admin")
      .select("id, nama, email")
      .eq("id", adminId)
      .single();

    if (adminError || !admin) {
      console.warn(
        "[getAdminAnalytics] Admin tidak ditemukan di DB:",
        adminId,
        adminError?.message
      );
      return res.status(404).json({ error: "Admin tidak ditemukan" });
    }

    console.log("[getAdminAnalytics] Admin ditemukan:", admin);

    const startDate = req.query.startDate
      ? new Date(String(req.query.startDate))
      : addDays(new Date(), -30);

    const endDate = req.query.endDate
      ? new Date(String(req.query.endDate))
      : new Date();

    const startISO = toISODate(startDate);
    const endISO = toISODate(endDate);

    const rangeDays = diffDays(startDate, endDate);
    const prevEnd = startDate;
    const prevStart = addDays(prevEnd, -rangeDays);

    const prevStartISO = toISODate(prevStart);
    const prevEndISO = toISODate(prevEnd);

    const [
      revenueNow,
      revenuePrev,
      progressNow,
      progressPrev,
      submissionsNow,
      submissionsPrev,
      enrollNow,
      enrollPrev,
      kelasRows,
      mentorRows,
      fakultasRows,
      materiRows,
      tugasRows,
      siswaRows,
    ] = await Promise.all([
      supabaseAnon
        .from("Pembayaran")
        .select("jumlah_bayar,tanggal_bayar,status_pembayaran")
        .eq("status_pembayaran", "berhasil")
        .gte("tanggal_bayar", startISO)
        .lt("tanggal_bayar", endISO),

      supabaseAnon
        .from("Pembayaran")
        .select("jumlah_bayar,tanggal_bayar,status_pembayaran")
        .eq("status_pembayaran", "berhasil")
        .gte("tanggal_bayar", prevStartISO)
        .lt("tanggal_bayar", prevEndISO),

      supabaseAnon
        .from("Progress")
        .select("id_User,id_Kelas,Total_tugas,Tugas_Selesai,Prsentase_Progress,Last_update")
        .gte("Last_update", startISO)
        .lt("Last_update", endISO),

      supabaseAnon
        .from("Progress")
        .select("id_User,id_Kelas,Total_tugas,Tugas_Selesai,Prsentase_Progress,Last_update")
        .gte("Last_update", prevStartISO)
        .lt("Last_update", prevEndISO),

      supabaseAnon
        .from("Pengumpulan_Tugas")
        .select("id_User,id_Kelas,tanggal_submit,nilai")
        .gte("tanggal_submit", startISO)
        .lt("tanggal_submit", endISO),

      supabaseAnon
        .from("Pengumpulan_Tugas")
        .select("id_User,id_Kelas,tanggal_submit,nilai")
        .gte("tanggal_submit", prevStartISO)
        .lt("tanggal_submit", prevEndISO),

      supabaseAnon
        .from("Pendaftaran")
        .select("id_Pendaftaran,tanggal_pendaftaran")
        .gte("tanggal_pendaftaran", startISO)
        .lt("tanggal_pendaftaran", endISO),

      supabaseAnon
        .from("Pendaftaran")
        .select("id_Pendaftaran,tanggal_pendaftaran")
        .gte("tanggal_pendaftaran", prevStartISO)
        .lt("tanggal_pendaftaran", prevEndISO),

      supabaseAnon.from("Kelas").select("id_Kelas,nama_kelas,id_Fakultas,id_Mentor"),
      supabaseAnon.from("Mentor").select("id_Mentor"),
      supabaseAnon.from("Fakultas").select("id_Fakultas"),
      supabaseAnon.from("Materi").select("id_Materi"),
      supabaseAnon.from("Tugas").select("id_Tugas"),
      supabaseAnon.from("User").select("id_User"),
    ]);

    // throw kalau error biar masuk catch
    if (revenueNow.error) throw revenueNow.error;
    if (revenuePrev.error) throw revenuePrev.error;
    if (progressNow.error) throw progressNow.error;
    if (progressPrev.error) throw progressPrev.error;
    if (submissionsNow.error) throw submissionsNow.error;
    if (submissionsPrev.error) throw submissionsPrev.error;
    if (enrollNow.error) throw enrollNow.error;
    if (enrollPrev.error) throw enrollPrev.error;
    if (kelasRows.error) throw kelasRows.error;

    const sumRevenue = (rows) =>
      (rows || []).reduce((acc, r) => acc + Number(r.jumlah_bayar ?? 0), 0);

    const totalRevenue = sumRevenue(revenueNow.data);
    const totalRevenuePrev = sumRevenue(revenuePrev.data);

    // active students (progress or submission in range)
    const activeSetNow = new Set();
    (progressNow.data || []).forEach((p) => p.id_User != null && activeSetNow.add(p.id_User));
    (submissionsNow.data || []).forEach((s) => s.id_User != null && activeSetNow.add(s.id_User));
    const activeStudents = activeSetNow.size;

    const activeSetPrev = new Set();
    (progressPrev.data || []).forEach((p) => p.id_User != null && activeSetPrev.add(p.id_User));
    (submissionsPrev.data || []).forEach((s) => s.id_User != null && activeSetPrev.add(s.id_User));
    const activeStudentsPrev = activeSetPrev.size;

    // completed classes
    const completedKeyNow = new Set();
    (progressNow.data || []).forEach((p) => {
      if (p.id_User == null || p.id_Kelas == null) return;
      if (isCompletedProgress(p)) completedKeyNow.add(`${p.id_User}:${p.id_Kelas}`);
    });
    const completedClasses = completedKeyNow.size;

    const completedKeyPrev = new Set();
    (progressPrev.data || []).forEach((p) => {
      if (p.id_User == null || p.id_Kelas == null) return;
      if (isCompletedProgress(p)) completedKeyPrev.add(`${p.id_User}:${p.id_Kelas}`);
    });
    const completedClassesPrev = completedKeyPrev.size;

    // avg progress (pakai max progress per user)
    const progressByUserNow = new Map();
    (progressNow.data || []).forEach((p) => {
      if (p.id_User == null) return;
      const v = progressValuePct(p);
      const prev = progressByUserNow.get(p.id_User);
      if (prev === undefined || v > prev) progressByUserNow.set(p.id_User, v);
    });

    const avgProgressPct = progressByUserNow.size
      ? Array.from(progressByUserNow.values()).reduce((a, b) => a + b, 0) /
        progressByUserNow.size
      : 0;

    const progressByUserPrev = new Map();
    (progressPrev.data || []).forEach((p) => {
      if (p.id_User == null) return;
      const v = progressValuePct(p);
      const prev = progressByUserPrev.get(p.id_User);
      if (prev === undefined || v > prev) progressByUserPrev.set(p.id_User, v);
    });

    const avgProgressPctPrev = progressByUserPrev.size
      ? Array.from(progressByUserPrev.values()).reduce((a, b) => a + b, 0) /
        progressByUserPrev.size
      : 0;

    const kpiDelta = {
      revenuePct: calcDeltaPct(totalRevenue, totalRevenuePrev),
      activeStudentsPct: calcDeltaPct(activeStudents, activeStudentsPrev),
      completedClassesPct: calcDeltaPct(completedClasses, completedClassesPrev),
      avgStudyPct: calcDeltaPct(avgProgressPct, avgProgressPctPrev),
    };

    const payload = {
      range: { startDate: startISO, endDate: endISO },
      kpis: {
        totalRevenue,
        activeStudents,
        completedClasses,
        avgStudyHoursPerDay: avgProgressPct, // (nama lu tetap)
        kpiDelta,

        // cards
        totalKelas: Array.isArray(kelasRows.data) ? kelasRows.data.length : 0,
        siswaAktif: Array.isArray(siswaRows.data) ? siswaRows.data.length : 0,
        totalMentor: Array.isArray(mentorRows.data) ? mentorRows.data.length : 0,
        totalFakultas: Array.isArray(fakultasRows.data) ? fakultasRows.data.length : 0,
        totalMateri: Array.isArray(materiRows.data) ? materiRows.data.length : 0,
        totalTugas: Array.isArray(tugasRows.data) ? tugasRows.data.length : 0,
      },

      // placeholder (kalau frontend belum pakai, biarin kosong)
      enrollmentVsCompletion: [],
      classPopularity: [],
      weeklyProgress: [],
      topPerformers: [],
      classPerformance: [],
      meta: {
        totalClasses: Array.isArray(kelasRows.data) ? kelasRows.data.length : 0,
      },
    };

    return res.json(payload);
  } catch (e) {
    console.error("[getAdminAnalytics] ERROR:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
