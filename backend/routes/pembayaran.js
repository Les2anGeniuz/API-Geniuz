import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { createPembayaran, getPembayaranByPendaftaran } from '../controllers/pembayaranController.js'

const router = express.Router()

router.post('/', requireAuth, createPembayaran)
router.get('/:idPendaftaran', requireAuth, getPembayaranByPendaftaran)

export default router
