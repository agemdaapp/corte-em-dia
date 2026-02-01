import { Router } from 'express'

import { listProfessionals } from '../controllers/professionals.controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', listProfessionals)

export default router

