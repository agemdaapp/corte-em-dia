import type { Request, Response } from 'express'

import { supabase } from '../lib/supabase'

function ensureAuthenticated(
  req: Request,
  res: Response
): req is Request & { user: NonNullable<Request['user']> } {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }

  return true
}

function ensureProfessional(
  req: Request,
  res: Response
): req is Request & { user: NonNullable<Request['user']> } {
  if (!ensureAuthenticated(req, res)) {
    return false
  }

  if (req.user.role !== 'professional') {
    res.status(403).json({ error: 'Forbidden' })
    return false
  }

  return true
}

function parseName(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseDurationMinutes(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return value > 0 ? value : null
}

function parsePrice(value: unknown) {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return value
}

export async function listServices(req: Request, res: Response) {
  if (!ensureAuthenticated(req, res)) {
    return
  }

  const professionalId =
    req.user.role === 'professional' ? req.user.id : String(req.query.professional_id ?? '')

  if (req.user.role === 'client' && !professionalId) {
    return res.status(400).json({ error: 'professional_id é obrigatório' })
  }

  let query = supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true })

  if (professionalId) {
    query = query.eq('professional_id', professionalId)
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  return res.status(200).json({ data: data ?? [] })
}

export async function createService(req: Request, res: Response) {
  if (!ensureProfessional(req, res)) {
    return
  }

  const name = parseName(req.body?.name)
  const durationMinutes = parseDurationMinutes(req.body?.duration_minutes)
  const price = parsePrice(req.body?.price)

  if (!name || durationMinutes === null) {
    return res.status(400).json({
      error: 'Validation Error',
      details: 'name e duration_minutes são obrigatórios',
    })
  }

  if (price === null) {
    return res.status(400).json({
      error: 'Validation Error',
      details: 'price deve ser um número válido quando informado',
    })
  }

  const { data, error } = await supabase
    .from('services')
    .insert({
      name,
      duration_minutes: durationMinutes,
      price: price ?? null,
      professional_id: req.user.id,
    })
    .select('*')
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  return res.status(201).json({ data })
}

export async function updateService(req: Request, res: Response) {
  if (!ensureProfessional(req, res)) {
    return
  }

  const { id } = req.params
  const updates: {
    name?: string
    duration_minutes?: number
    price?: number | null
  } = {}

  if ('name' in req.body) {
    const name = parseName(req.body?.name)
    if (!name) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'name deve ser uma string não vazia',
      })
    }
    updates.name = name
  }

  if ('duration_minutes' in req.body) {
    const durationMinutes = parseDurationMinutes(req.body?.duration_minutes)
    if (durationMinutes === null) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'duration_minutes deve ser maior que 0',
      })
    }
    updates.duration_minutes = durationMinutes
  }

  if ('price' in req.body) {
    const price = parsePrice(req.body?.price)
    if (price === null) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'price deve ser um número válido quando informado',
      })
    }
    updates.price = price ?? null
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      details: 'Informe ao menos um campo para atualizar',
    })
  }

  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .eq('professional_id', req.user.id)
    .select('*')
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  return res.status(200).json({ data })
}

export async function deleteService(req: Request, res: Response) {
  if (!ensureProfessional(req, res)) {
    return
  }

  const { id } = req.params

  const { data, error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('professional_id', req.user.id)
    .select('*')
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  return res.status(200).json({ data })
}


