import express from 'express'
import requireAdmin from '../middleware/adminAuth.js'
import {
  getAllMentor,
  createMentor,
  updateMentor,
  deleteMentor
} from '../controllers/adminMentorController.js'

const router = express.Router()

router.get('/', requireAdmin, getAllMentor)
router.post('/', requireAdmin, createMentor)
router.put('/:id', requireAdmin, updateMentor)
router.delete('/:id', requireAdmin, deleteMentor)

export default router
