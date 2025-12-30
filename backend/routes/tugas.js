import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getTugasByKelas, getTugasById, getActiveTugasForUser } from '../controllers/tugasController.js'

const router = express.Router()

router.get('/kelas/:id', getTugasByKelas)
router.get('/me/aktif', requireAuth, getActiveTugasForUser)
router.get('/:id', getTugasById)

export default router