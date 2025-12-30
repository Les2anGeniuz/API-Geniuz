import express from 'express'
import { getAllMentor, getMentorById, getMentorByFakultas } from '../controllers/mentorController.js'

const router = express.Router()

router.get('/', getAllMentor)
router.get('/:id', getMentorById)
router.get('/fakultas/:id', getMentorByFakultas)

export default router
