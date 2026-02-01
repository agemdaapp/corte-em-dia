import type { NextFunction, Request, Response } from 'express'

import { supabase, supabaseAdmin } from '../lib/supabase'

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Espera o header no formato: Authorization: Bearer <token>
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const [scheme, token] = authHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data, error: userError } = await supabase.auth.getUser(token)

  if (userError || !data.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Perfil é obrigatório para liberar a request
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, name')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  if (!profile) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  req.user = {
    id: profile.id,
    email: profile.email ?? data.user.email ?? null,
    role: profile.role ?? null,
    name: profile.name ?? null
  }

  return next()
}

