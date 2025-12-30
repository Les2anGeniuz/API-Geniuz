import express from 'express'
import requireAdmin from '../middleware/adminAuth.js'
import {
  listAdminSiswa,
  getAdminSiswaById,
  updateAdminSiswa,
  deleteAdminSiswa
} from '../controllers/adminSiswaController.js'

const router = express.Router()

router.get('/', requireAdmin, listAdminSiswa)
router.get('/:id', requireAdmin, getAdminSiswaById)
router.put('/:id', requireAdmin, updateAdminSiswa)
router.delete('/:id', requireAdmin, deleteAdminSiswa)

export default router
