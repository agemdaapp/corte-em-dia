import { Router } from 'express'

import { getSummaryReport } from '../controllers/reports.controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/summary', getSummaryReport)

export default router

