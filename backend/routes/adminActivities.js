import { Router } from 'express';
import { getAdminActivities } from '../controllers/adminActivitiesController.js';
import requireAdmin from '../middleware/adminAuth.js';

const router = Router();
router.get('/', requireAdmin, getAdminActivities);
export default router;