import type { Request, Response } from 'express'

import { supabase } from '../lib/supabase'

export async function listProfessionals(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'professional')
    .order('name', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  return res.status(200).json({ data: data ?? [] })
}

