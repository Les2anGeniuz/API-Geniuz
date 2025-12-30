// backend/routes/adminPengumpulanTugas.js

import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { getPengumpulanTugas, updateNilaiPengumpulanTugas } from "../controllers/adminPengumpulanTugasController.js";
const router = express.Router();

// GET /admin/tugas/:idTugas/pengumpulan
router.get("/tugas/:idTugas/pengumpulan", adminAuth, getPengumpulanTugas);


// POST /admin/tugas/:idTugas/pengumpulan/:idPengumpulan/nilai
router.post("/tugas/:idTugas/pengumpulan/:idPengumpulan/nilai", adminAuth, updateNilaiPengumpulanTugas);

export default router;
