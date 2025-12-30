import { Router } from 'express'
import { getMateriByKelas, getMateriById, getMateri } from '../controllers/materiController.js'

const router = Router()

router.get('/', getMateri)
router.get('/kelas/:id', getMateriByKelas)
router.get('/:id', getMateriById)

export default router
