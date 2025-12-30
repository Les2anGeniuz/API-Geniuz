// backend/controllers/adminAnalyticsController.js
import { supabaseAdmin } from "../services/supabase.js";

// Helpers
function toISO(d) {
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

// ===== BAR CHART: siswa baru per bulan (tahun ini) =====
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

    // NOTE: ini tetap ambil rows karena butuh group by month (tanpa SQL aggregate).
    // Tapi kita ambil kolom minimal biar ringan.
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const { data, error } = await supabaseAdmin
      .from("Pendaftaran")
      .select("tanggal_pendaftaran")
      .gte("tanggal_pendaftaran", toISO(start))
      .lt("tanggal_pendaftaran", toISO(end));

    if (error) return res.status(500).json({ error: error.message });

    const monthly = Array(12).fill(0);
    for (const row of data || []) {
      const date = new Date(row.tanggal_pendaftaran);
      if (date.getFullYear() === year) monthly[date.getMonth()] += 1;
    }

    return res.json({ months, counts: monthly });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
};

// ===== LINE CHART: revenue per bulan (tahun ini) =====
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
      .select("jumlah_bayar,tanggal_bayar,status_pembayaran")
      .eq("status_pembayaran", "berhasil")
      .gte("tanggal_bayar", toISO(start))
      .lt("tanggal_bayar", toISO(end));

    if (error) return res.status(500).json({ error: error.message });

    const monthly = Array(12).fill(0);
    for (const row of data || []) {
      const date = new Date(row.tanggal_bayar);
      if (date.getFullYear() === year) {
        monthly[date.getMonth()] += Number(row.jumlah_bayar || 0);
      }
    }

    return res.json({ months, revenues: monthly });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
};

// ===== MAIN DASHBOARD ANALYTICS =====
export async function getAdminAnalytics(req, res) {
  try {
    const adminId = req.user?.adminId;
    if (!adminId) return res.status(401).json({ error: "Unauthorized: adminId missing" });

    // validasi admin (service role supaya aman dari RLS)
    const { data: admin, error: adminError } = await supabaseAdmin
      .from("Admin")
      .select("id,nama,email")
      .eq("id", adminId)
      .single();

    if (adminError || !admin) {
      return res.status(404).json({ error: "Admin tidak ditemukan" });
    }

    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : addDays(new Date(), -30);
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : new Date();

    const startISO = toISO(startDate);
    const endISO = toISO(endDate);

    const rangeDays = diffDays(startDate, endDate);
    const prevEnd = startDate;
    const prevStart = addDays(prevEnd, -rangeDays);

    const prevStartISO = toISO(prevStart);
    const prevEndISO = toISO(prevEnd);

    // ==== KPI yang “count doang” pake head:true biar super ringan (anti timeout) ====
    const [
      totalKelas,
      totalMentor,
      totalFakultas,
      totalMateri,
      totalTugas,
      totalUser,

      enrollNowCount,
      enrollPrevCount,

      // progress/submission tetap butuh rows untuk logic aktif & completed
      progressNow,
      progressPrev,
      submissionsNow,
      submissionsPrev,

      revenueNow,
      revenuePrev,
    ] = await Promise.all([
      supabaseAdmin.from("Kelas").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("Mentor").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("Fakultas").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("Materi").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("Tugas").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("User").select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("Pendaftaran")
        .select("*", { count: "exact", head: true })
        .gte("tanggal_pendaftaran", startISO)
        .lt("tanggal_pendaftaran", endISO),

      supabaseAdmin
        .from("Pendaftaran")
        .select("*", { count: "exact", head: true })
        .gte("tanggal_pendaftaran", prevStartISO)
        .lt("tanggal_pendaftaran", prevEndISO),

      supabaseAdmin
        .from("Progress")
        .select("id_User,id_Kelas,Total_tugas,Tugas_Selesai,Prsentase_Progress,Last_update")
        .gte("Last_update", startISO)
        .lt("Last_update", endISO),

      supabaseAdmin
        .from("Progress")
        .select("id_User,id_Kelas,Total_tugas,Tugas_Selesai,Prsentase_Progress,Last_update")
        .gte("Last_update", prevStartISO)
        .lt("Last_update", prevEndISO),

      supabaseAdmin
        .from("Pengumpulan_Tugas")
        .select("id_User,id_Kelas,tanggal_submit,nilai")
        .gte("tanggal_submit", startISO)
        .lt("tanggal_submit", endISO),

      supabaseAdmin
        .from("Pengumpulan_Tugas")
        .select("id_User,id_Kelas,tanggal_submit,nilai")
        .gte("tanggal_submit", prevStartISO)
        .lt("tanggal_submit", prevEndISO),

      supabaseAdmin
        .from("Pembayaran")
        .select("jumlah_bayar,tanggal_bayar,status_pembayaran")
        .eq("status_pembayaran", "berhasil")
        .gte("tanggal_bayar", startISO)
        .lt("tanggal_bayar", endISO),

      supabaseAdmin
        .from("Pembayaran")
        .select("jumlah_bayar,tanggal_bayar,status_pembayaran")
        .eq("status_pembayaran", "berhasil")
        .gte("tanggal_bayar", prevStartISO)
        .lt("tanggal_bayar", prevEndISO),
    ]);

    // error check minimal
    for (const r of [
      progressNow,
      progressPrev,
      submissionsNow,
      submissionsPrev,
      revenueNow,
      revenuePrev,
    ]) {
      if (r.error) throw r.error;
    }

    const sumRevenue = (rows) => (rows || []).reduce((acc, r) => acc + Number(r.jumlah_bayar ?? 0), 0);

    const totalRevenue = sumRevenue(revenueNow.data);
    const totalRevenuePrev = sumRevenue(revenuePrev.data);

    const activeSetNow = new Set();
    for (const p of progressNow.data || []) if (p.id_User != null) activeSetNow.add(p.id_User);
    for (const s of submissionsNow.data || []) if (s.id_User != null) activeSetNow.add(s.id_User);
    const activeStudents = activeSetNow.size;

    const activeSetPrev = new Set();
    for (const p of progressPrev.data || []) if (p.id_User != null) activeSetPrev.add(p.id_User);
    for (const s of submissionsPrev.data || []) if (s.id_User != null) activeSetPrev.add(s.id_User);
    const activeStudentsPrev = activeSetPrev.size;

    const completedKeyNow = new Set();
    for (const p of progressNow.data || []) {
      if (p.id_User == null || p.id_Kelas == null) continue;
      if (isCompletedProgress(p)) completedKeyNow.add(`${p.id_User}:${p.id_Kelas}`);
    }
    const completedClasses = completedKeyNow.size;

    const completedKeyPrev = new Set();
    for (const p of progressPrev.data || []) {
      if (p.id_User == null || p.id_Kelas == null) continue;
      if (isCompletedProgress(p)) completedKeyPrev.add(`${p.id_User}:${p.id_Kelas}`);
    }
    const completedClassesPrev = completedKeyPrev.size;

    const progressByUserNow = new Map();
    for (const p of progressNow.data || []) {
      if (p.id_User == null) continue;
      const v = progressValuePct(p);
      const prev = progressByUserNow.get(p.id_User);
      if (prev === undefined || v > prev) progressByUserNow.set(p.id_User, v);
    }
    const avgProgressPct = progressByUserNow.size
      ? Array.from(progressByUserNow.values()).reduce((a, b) => a + b, 0) / progressByUserNow.size
      : 0;

    const progressByUserPrev = new Map();
    for (const p of progressPrev.data || []) {
      if (p.id_User == null) continue;
      const v = progressValuePct(p);
      const prev = progressByUserPrev.get(p.id_User);
      if (prev === undefined || v > prev) progressByUserPrev.set(p.id_User, v);
    }
    const avgProgressPctPrev = progressByUserPrev.size
      ? Array.from(progressByUserPrev.values()).reduce((a, b) => a + b, 0) / progressByUserPrev.size
      : 0;

    const kpiDelta = {
      revenuePct: calcDeltaPct(totalRevenue, totalRevenuePrev),
      activeStudentsPct: calcDeltaPct(activeStudents, activeStudentsPrev),
      completedClassesPct: calcDeltaPct(completedClasses, completedClassesPrev),
      avgStudyPct: calcDeltaPct(avgProgressPct, avgProgressPctPrev),
      enrollPct: calcDeltaPct(enrollNowCount.count || 0, enrollPrevCount.count || 0),
    };

    return res.json({
      admin,
      range: { startDate: startISO, endDate: endISO },
      kpis: {
        totalRevenue,
        activeStudents,
        completedClasses,
        avgStudyHoursPerDay: avgProgressPct,
        kpiDelta,

        totalKelas: totalKelas.count || 0,
        siswaAktif: totalUser.count || 0,
        totalMentor: totalMentor.count || 0,
        totalFakultas: totalFakultas.count || 0,
        totalMateri: totalMateri.count || 0,
        totalTugas: totalTugas.count || 0,

        pendaftaranNow: enrollNowCount.count || 0,
        pendaftaranPrev: enrollPrevCount.count || 0,
      },
      meta: { totalClasses: totalKelas.count || 0 },
    });
  } catch (e) {
    console.error("[getAdminAnalytics] ERROR:", e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
