import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getMyKelas } from '../controllers/meController.js'
import { getMyProfile } from '../controllers/meController.js'
import { updateProfile } from '../controllers/meController.js'

const router = express.Router()

// Endpoint ini akan mengarah ke: GET /api/me/kelas
// (Asumsi di server.js Anda me-mount route ini ke '/api/me')
router.get('/kelas', requireAuth, getMyKelas)
router.get('/profile', requireAuth, getMyProfile); // Untuk nampilin data
router.put('/update', requireAuth, updateProfile);

export default router