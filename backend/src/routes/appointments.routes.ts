import { Router } from 'express'

import { createAppointment } from '../controllers/appointments.controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

// Criação exige usuário autenticado.
router.use(authMiddleware)

router.post('/', createAppointment)

export default router


