import express from 'express'
import requireAdmin from '../middleware/adminAuth.js'
import {
  listAdminMateri,
  getAdminMateriById,
  createAdminMateri,
  updateAdminMateri,
  deleteAdminMateri
} from '../controllers/adminMateriController.js'

const router = express.Router()

router.get('/', requireAdmin, listAdminMateri)
router.get('/:id', requireAdmin, getAdminMateriById)
router.post('/', requireAdmin, createAdminMateri)
router.put('/:id', requireAdmin, updateAdminMateri)
router.delete('/:id', requireAdmin, deleteAdminMateri)

export default router
