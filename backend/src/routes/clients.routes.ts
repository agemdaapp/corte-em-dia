import { Router } from 'express'

import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from '../controllers/clients.controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

// Todas as rotas exigem usuário autenticado.
router.use(authMiddleware)

router.get('/', listClients)
router.post('/', createClient)
router.put('/:id', updateClient)
router.delete('/:id', deleteClient)

export default router

