import express from 'express'
import {requireAuth} from '../middleware/auth.js'
import {
  getDashboardProfile,
  getDashboardOverview,
  getDashboardTugasAktif,
  getDashboardActivity,
  getDashboardAchievement,
  getDashboardStatistik,
  getDashboardKelasSaya,
  getDashboardKelas
} from '../controllers/dashboardController.js'

const router = express.Router()

router.get('/profile', requireAuth, getDashboardProfile)
router.get('/overview', requireAuth, getDashboardOverview)
router.get('/tugas-aktif', requireAuth, getDashboardTugasAktif)
router.get('/activity', requireAuth, getDashboardActivity)
router.get('/achievement', requireAuth, getDashboardAchievement)
router.get('/statistik', requireAuth, getDashboardStatistik)
router.get('/kelas-saya', requireAuth, getDashboardKelasSaya)
router.get('/kelas', requireAuth, getDashboardKelas)

export default router
