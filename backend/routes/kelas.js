import express from 'express'
import { getAllKelas, getKelasByFakultas } from '../controllers/kelasController.js'

const router = express.Router()

router.get('/', getAllKelas)
router.get('/:id', getKelasByFakultas)

export default router
