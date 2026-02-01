import { Router } from 'express'

import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  listMyAppointments,
  updateAppointment,
} from '../controllers/appointments.controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

// Criação exige usuário autenticado.
router.use(authMiddleware)

router.get('/', listAppointments)
router.get('/me', listMyAppointments)
router.post('/', createAppointment)
router.put('/:id', updateAppointment)
router.delete('/:id', deleteAppointment)

export default router


