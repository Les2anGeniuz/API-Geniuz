import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getMySubmissionForTugas, submitTugas } from '../controllers/pengumpulanTugasController.js'

const router = express.Router()

router.get('/tugas/:id/me', requireAuth, getMySubmissionForTugas)
router.post('/tugas/:id/submit', requireAuth, submitTugas)

export default router