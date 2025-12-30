import express from 'express'
import requireAdmin from '../middleware/adminAuth.js'
import { getAdminMe, getAdminById } from '../controllers/adminController.js'

const router = express.Router()

router.get('/me', requireAdmin, getAdminMe)
router.get('/:id', requireAdmin, getAdminById)

export default router
