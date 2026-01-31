import { Router } from 'express'

import {
  createService,
  deleteService,
  listServices,
  updateService,
} from '../controllers/services.controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

// Todas as rotas exigem usuário autenticado.
router.use(authMiddleware)

router.get('/', listServices)
router.post('/', createService)
router.put('/:id', updateService)
router.delete('/:id', deleteService)

export default router


