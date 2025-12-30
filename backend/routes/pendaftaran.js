import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { createPendaftaran, getMyPendaftarans, updatePendaftaran } from '../controllers/pendaftaranController.js'

const router = express.Router()

router.post('/', requireAuth, createPendaftaran)
router.get('/me', requireAuth, getMyPendaftarans)

// Update pendaftaran by id
router.put('/:id', requireAuth, updatePendaftaran)

export default router
