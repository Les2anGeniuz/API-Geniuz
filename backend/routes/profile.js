import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getMyProfile, updateMyProfile } from '../controllers/profileController.js'

const router = express.Router()

// GET /api/me
// (Path cukup '/' karena sudah di-mount ke '/api/me' di server.js)
router.get('/', requireAuth, getMyProfile)

// PUT /api/me
router.put('/', requireAuth, updateMyProfile)

export default router