import express from 'express'
import requireAdmin from '../middleware/adminAuth.js'
import {
  listAdminKelas,
  getAdminKelasById,
  createAdminKelas,
  updateAdminKelas,
  deleteAdminKelas
} from '../controllers/adminKelasController.js'

const router = express.Router()

router.get('/', requireAdmin, listAdminKelas)
router.get('/:id', requireAdmin, getAdminKelasById)
router.post('/', requireAdmin, createAdminKelas)
router.put('/:id', requireAdmin, updateAdminKelas)
router.delete('/:id', requireAdmin, deleteAdminKelas)

export default router
