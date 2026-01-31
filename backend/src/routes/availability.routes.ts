import { Router } from 'express'

import { getAvailability } from '../controllers/availability.controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

// Disponibilidade exige usuário autenticado.
router.use(authMiddleware)

router.get('/', getAvailability)

export default router


