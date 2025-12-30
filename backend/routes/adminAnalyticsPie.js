import express from 'express';
const router = express.Router();
import requireAdmin from '../middleware/adminAuth.js';
import { siswaPerFakultas } from '../controllers/adminSiswaController.js';
import { revenueMonthly, newStudentsMonthly } from '../controllers/adminAnalyticsController.js';

// Endpoint: GET /api/admin/new-students-monthly
router.get('/new-students-monthly', requireAdmin, newStudentsMonthly);
// Endpoint: GET /api/admin/siswa-per-fakultas
router.get('/siswa-per-fakultas', requireAdmin, siswaPerFakultas);
// Endpoint: GET /api/admin/revenue-monthly
router.get('/revenue-monthly', requireAdmin, revenueMonthly);

export default router;
