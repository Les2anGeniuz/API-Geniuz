import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getMyProgress, getMyProgressByKelas } from '../controllers/progressController.js'

const router = express.Router()

router.get('/me', requireAuth, getMyProgress)
router.get('/kelas/:id', requireAuth, getMyProgressByKelas)

export default router