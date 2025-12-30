import express from 'express'
import requireAdmin from '../middleware/adminAuth.js'
import {
  getAllFakultas,
  createFakultas,
  updateFakultas,
  deleteFakultas
} from '../controllers/adminFakultasController.js'

const router = express.Router()

router.get('/', requireAdmin, getAllFakultas)
router.post('/', requireAdmin, createFakultas)
router.put('/:id', requireAdmin, updateFakultas)
router.delete('/:id', requireAdmin, deleteFakultas)

export default router
