import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import pendaftaranRoutes from "./routes/pendaftaran.js";
import pembayaranRoutes from "./routes/pembayaran.js";
import profileRoutes from "./routes/profile.js";
import fakultasRoutes from "./routes/fakultas.js";
import kelasRoutes from "./routes/kelas.js";
import meRoutes from "./routes/me.js";
import materiRoutes from "./routes/materi.js";
import tugasRoutes from "./routes/tugas.js";
import pengumpulanTugasRoutes from "./routes/pengumpulanTugas.js";
import progressRoutes from "./routes/progress.js";
import mentorRoutes from "./routes/mentor.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import adminRoutes from "./routes/admin.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminFakultasRoutes from "./routes/adminFakultas.js";
import adminMentorRoutes from "./routes/adminMentor.js";
import adminKelasRoutes from "./routes/adminKelas.js";
import adminMateriRoutes from "./routes/adminMateri.js";
import adminTugasRoutes from "./routes/adminTugas.js";
import adminSiswaRoutes from "./routes/adminSiswa.js";
import adminAnalyticsRoutes from "./routes/adminAnalytics.js";
import adminAnalyticsPieRoutes from "./routes/adminAnalyticsPie.js";
import adminActivitiesRoutes from "./routes/adminActivities.js";
import adminPengumpulanTugasRoutes from "./routes/adminPengumpulanTugas.js";
import notifikasiRoutes from "./routes/notifikasi.js";

// Jangan auto-run worker di serverless:
// import checkDeadlines from "./services/notificationWorker.js";

dotenv.config();

const app = express();

// CORS sekali saja, rapi
const allowedOrigins =
  process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean) || [];

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

app.use(express.json());

// root health
app.get("/", (_, res) => res.send("API OK"));

// routes (biarkan sama persis)
app.use("/api/auth", authRoutes);
app.use("/api/pendaftaran", pendaftaranRoutes);
app.use("/api/pembayaran", pembayaranRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/fakultas", fakultasRoutes);
app.use("/api/kelas", kelasRoutes);
app.use("/api/me", meRoutes);
app.use("/api/materi", materiRoutes);
app.use("/api/tugas", tugasRoutes);
app.use("/api/pengumpulan", pengumpulanTugasRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin/fakultas", adminFakultasRoutes);
app.use("/api/admin/mentor", adminMentorRoutes);
app.use("/api/admin/kelas", adminKelasRoutes);
app.use("/api/admin/materi", adminMateriRoutes);
app.use("/api/admin/tugas", adminTugasRoutes);
app.use("/api/admin", adminPengumpulanTugasRoutes);
app.use("/api/admin/siswa", adminSiswaRoutes);

// analytics (tetap)
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin", adminAnalyticsPieRoutes);
app.use("/api/admin/activities", adminActivitiesRoutes);

// admin routes PALING BAWAH
app.use("/api/admin", adminRoutes);

app.use("/api/notifikasi", notifikasiRoutes);

app.get("/api/debug/env", (req, res) => {
  res.json({
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    JWT_SECRET: !!process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  });
});

/**
 * checkDeadlines() jangan dijalankan di Vercel serverless.
 * Nanti kita bikin endpoint khusus (mis: /api/cron/check-deadlines)
 * lalu dijalankan pakai Vercel Cron.
 */

// ini yang dibutuhkan gateway Vercel
export default app;
