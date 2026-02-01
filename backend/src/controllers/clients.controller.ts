import type { Request, Response } from 'express'

import { supabaseAdmin } from '../lib/supabase'

function ensureProfessional(
  req: Request,
  res: Response
): req is Request & { user: NonNullable<Request['user']> } {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
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

function parseEmail(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null
}

function parsePhone(value: unknown) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parsePassword(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed || trimmed.length < 6) {
    return null
  }

  return trimmed
}

export async function listClients(req: Request, res: Response) {
  if (!ensureProfessional(req, res)) {
    return
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email, phone')
    .eq('role', 'client')
    .eq('professional_id', req.user.id)
    .order('name', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  return res.status(200).json({ data: data ?? [] })
}

export async function createClient(req: Request, res: Response) {
  if (!ensureProfessional(req, res)) {
    return
  }

  const name = parseName(req.body?.name)
  const email = parseEmail(req.body?.email)
  const phone = parsePhone(req.body?.phone)
  const password = parsePassword(req.body?.password)

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      details: 'name, email e password são obrigatórios',
    })
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

  if (userError || !userData.user) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userData.user.id,
      email,
      name,
      phone,
      role: 'client',
      professional_id: req.user.id,
    })
    .select('id, name, email, phone')
    .maybeSingle()

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  return res.status(201).json({ data: profileData })
}

export async function updateClient(req: Request, res: Response) {
  if (!ensureProfessional(req, res)) {
    return
  }

  const id = String(req.params.id ?? '')
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  const updates: {
    name?: string
    email?: string
    phone?: string | null
  } = {}

  const name = 'name' in req.body ? parseName(req.body?.name) : undefined
  if (name === null) {
    return res.status(400).json({
      error: 'Validation Error',
      details: 'name deve ser uma string não vazia',
    })
  }
  if (name) {
    updates.name = name
  }

  const email = 'email' in req.body ? parseEmail(req.body?.email) : undefined
  if (email === null) {
    return res.status(400).json({
      error: 'Validation Error',
      details: 'email inválido',
    })
  }
  if (email) {
    updates.email = email
  }

  const phone = 'phone' in req.body ? parsePhone(req.body?.phone) : undefined
  if (phone === null && 'phone' in req.body) {
    return res.status(400).json({
      error: 'Validation Error',
      details: 'phone deve ser uma string válida',
    })
  }
  if (phone !== undefined) {
    updates.phone = phone
  }

  const password =
    'password' in req.body ? parsePassword(req.body?.password) : undefined
  if (password === null && 'password' in req.body) {
    return res.status(400).json({
      error: 'Validation Error',
      details: 'password deve ter ao menos 6 caracteres',
    })
  }

  if (Object.keys(updates).length === 0 && password === undefined) {
    return res.status(400).json({
      error: 'Validation Error',
      details: 'Informe ao menos um campo para atualizar',
    })
  }

  const { data: currentProfile, error: currentError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, professional_id')
    .eq('id', id)
    .maybeSingle()

  if (currentError) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  if (
    !currentProfile ||
    currentProfile.role !== 'client' ||
    currentProfile.professional_id !== req.user.id
  ) {
    return res.status(404).json({ error: 'Client not found' })
  }

  if (email || password) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      {
        email: email ?? undefined,
        password: password ?? undefined,
        user_metadata: name ? { name } : undefined,
      }
    )

    if (authError) {
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .eq('professional_id', req.user.id)
      .select('id, name, email, phone')
      .maybeSingle()

    if (error) {
      return res.status(500).json({ error: 'Internal Server Error' })
    }

    return res.status(200).json({ data })
  }

  return res.status(200).json({ data: { id, ...updates } })
}

export async function deleteClient(req: Request, res: Response) {
  if (!ensureProfessional(req, res)) {
    return
  }

  const id = String(req.params.id ?? '')
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', id)
    .eq('professional_id', req.user.id)

  if (profileError) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (authError) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  return res.status(204).send()
}

