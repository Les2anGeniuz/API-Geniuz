import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getMyNotifikasi, markAsRead } from '../controllers/notifikasiController.js'

const router = express.Router()

router.get('/', requireAuth, getMyNotifikasi)
router.put('/:id_Notif/read', requireAuth, markAsRead)

export default router