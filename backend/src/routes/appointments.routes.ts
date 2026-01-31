import { Router } from 'express'

import {
  createAppointment,
  listAppointments,
} from '../controllers/appointments.controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

// Criação exige usuário autenticado.
router.use(authMiddleware)

router.get('/', listAppointments)
router.post('/', createAppointment)

export default router


