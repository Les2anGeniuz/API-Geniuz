import express from 'express'
import { getAllFakultas, getFakultasById } from '../controllers/fakultasController.js'

const router = express.Router()

router.get('/', getAllFakultas)
router.get('/:id', getFakultasById)

export default router
