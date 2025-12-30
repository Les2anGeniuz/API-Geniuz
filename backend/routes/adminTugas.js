import express from 'express'
import requireAdmin from '../middleware/adminAuth.js'
import {
  listAdminTugas,
  getAdminTugasById,
  createAdminTugas,
  updateAdminTugas,
  deleteAdminTugas
} from '../controllers/adminTugasController.js'

const router = express.Router()

router.get('/', requireAdmin, listAdminTugas)
router.get('/:id', requireAdmin, getAdminTugasById)
router.post('/', requireAdmin, createAdminTugas)
router.put('/:id', requireAdmin, updateAdminTugas)
router.delete('/:id', requireAdmin, deleteAdminTugas)

export default router
