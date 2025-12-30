import { Router } from 'express';
import { getAdminAnalytics } from '../controllers/adminAnalyticsController.js';
import requireAdmin from '../middleware/adminAuth.js';

const router = Router();
router.get('/', (req, res, next) => {
	console.log('[ROUTE] /api/admin/analytics HIT');
	next();
}, requireAdmin, getAdminAnalytics);
export default router;