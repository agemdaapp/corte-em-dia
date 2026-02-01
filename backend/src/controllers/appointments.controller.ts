import type { Request, Response } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const DAY_START_MINUTES = 8 * 60
const DAY_END_MINUTES = 18 * 60
const DEBUG_ERRORS = process.env.DEBUG_ERRORS === 'true'

type AppointmentWindow = {
  startMinutes: number
  endMinutes: number
}

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

function respondWithError(
  res: Response,
  error: { code?: string | null; message?: string; details?: string | null; hint?: string | null }
) {
  if (DEBUG_ERRORS) {
    return res.status(500).json({
      error: 'Internal Server Error',
      debug: {
        code: error.code ?? null,
        message: error.message ?? null,
        details: error.details ?? null,
        hint: error.hint ?? null,
      },
    })
  }

  return res.status(500).json({ error: 'Internal Server Error' })
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

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime())
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return hours * 60 + minutes
}

function parseDateTimeToUtcParts(dateTime: string) {
  const parsed = new Date(dateTime)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsed.getUTCDate()).padStart(2, '0')
  const hours = String(parsed.getUTCHours()).padStart(2, '0')
  const minutes = String(parsed.getUTCMinutes()).padStart(2, '0')

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  }
}

function toUtcMinutes(dateTime: string) {
  const parsed = new Date(dateTime)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.getUTCHours() * 60 + parsed.getUTCMinutes()
}

function addMinutesToUtc(dateTime: string, minutes: number) {
  const parsed = new Date(dateTime)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  parsed.setUTCMinutes(parsed.getUTCMinutes() + minutes)
  return parsed.toISOString()
}

function getServiceDuration(service: unknown) {
  if (Array.isArray(service)) {
    const first = service[0] as { duration_minutes?: unknown } | undefined
    if (first && typeof first.duration_minutes === 'number') {
      return first.duration_minutes
    }
    return null
  }

  if (service && typeof (service as { duration_minutes?: unknown }).duration_minutes === 'number') {
    return (service as { duration_minutes: number }).duration_minutes
  }

  return null
}

function buildAppointmentWindows(rows: Array<{
  start_time: string | null
  end_time: string | null
  duration_minutes?: number | null
  service?:
    | { duration_minutes?: number | null }
    | { duration_minutes?: number | null }[]
    | null
}>) {
  const windows: AppointmentWindow[] = []

  for (const row of rows) {
    if (!row.start_time) {
      continue
    }

    const startMinutes = toUtcMinutes(row.start_time)
    if (startMinutes === null) {
      continue
    }

    let endMinutes = row.end_time ? toUtcMinutes(row.end_time) : null
    const serviceDurationFromJoin = Array.isArray(row.service)
      ? row.service[0]?.duration_minutes
      : row.service?.duration_minutes
    const serviceDuration =
      row.duration_minutes ??
      (typeof serviceDurationFromJoin === 'number' ? serviceDurationFromJoin : null)

    if (endMinutes === null && serviceDuration) {
      endMinutes = startMinutes + serviceDuration
    }

    if (endMinutes === null) {
      continue
    }

    windows.push({ startMinutes, endMinutes })
  }

  return windows.sort((a, b) => a.startMinutes - b.startMinutes)
}

function hasCollision(
  startMinutes: number,
  endMinutes: number,
  windows: AppointmentWindow[]
) {
  return windows.some(
    (window) => startMinutes < window.endMinutes && endMinutes > window.startMinutes
  )
}

export async function listAppointments(req: Request, res: Response) {
  if (!ensureAuthenticated(req, res)) {
    return
  }

  const date = String(req.query.date ?? '')

  if (!date || !isValidDateString(date)) {
    return res.status(400).json({ error: 'Invalid date' })
  }

  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  if (req.user.role !== 'professional' && req.user.role !== 'client') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  let query = supabaseAdmin
    .from('appointments')
    .select(
      'id, start_time, end_time, service_id, client_id, professional_id, service:services(name, duration_minutes), client:profiles(name)'
    )
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time', { ascending: true })

  if (req.user.role === 'client') {
    query = query.eq('client_id', req.user.id)
  } else {
    query = query.eq('professional_id', req.user.id)
  }

  const { data, error } = await query

  if (error) {
    console.error('listAppointments error', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return respondWithError(res, error)
  }

  const normalized = (data ?? []).map((item) => {
    const duration = getServiceDuration(item.service)
    const endTime =
      item.end_time ??
      (item.start_time && duration !== null
        ? addMinutesToUtc(item.start_time, duration)
        : null)

    return {
      ...item,
      end_time: endTime ?? item.end_time,
    }
  })

  return res.status(200).json({ data: normalized })
}

export async function listMyAppointments(req: Request, res: Response) {
  if (!ensureAuthenticated(req, res)) {
    return
  }

  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const includePast = String(req.query.include_past ?? '') === 'true'
  const now = new Date().toISOString()

  let query = supabaseAdmin
    .from('appointments')
    .select(
      'id, start_time, end_time, service:services(name, duration_minutes)'
    )
    .eq('client_id', req.user.id)
    .order('start_time', { ascending: true })

  if (!includePast) {
    query = query.gte('start_time', now)
  }

  const { data, error } = await query

  if (error) {
    console.error('listMyAppointments error', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return respondWithError(res, error)
  }

  const normalized = (data ?? []).map((item) => {
    const duration = getServiceDuration(item.service)
    const endTime =
      item.end_time ??
      (item.start_time && duration !== null
        ? addMinutesToUtc(item.start_time, duration)
        : null)

    return {
      ...item,
      end_time: endTime ?? item.end_time,
    }
  })

  return res.status(200).json({ data: normalized })
}

export async function createAppointment(req: Request, res: Response) {
  if (!ensureAuthenticated(req, res)) {
    return
  }

  const serviceId = String(req.body?.service_id ?? '')
  const date = String(req.body?.date ?? '')
  const startTime = String(req.body?.start_time ?? '')

  if (!serviceId || !isValidUuid(serviceId)) {
    return res.status(400).json({ error: 'Invalid service_id' })
  }

  if (!date || !isValidDateString(date)) {
    return res.status(400).json({ error: 'Invalid date' })
  }

  const startMinutes = parseTime(startTime)
  if (startMinutes === null) {
    return res.status(400).json({ error: 'Invalid start_time' })
  }

  if (startMinutes < DAY_START_MINUTES || startMinutes > DAY_END_MINUTES) {
    return res.status(400).json({ error: 'start_time fora do horário permitido' })
  }

  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('id, duration_minutes, professional_id')
    .eq('id', serviceId)
    .maybeSingle()

  if (serviceError) {
    console.error('createAppointment service lookup error', {
      code: serviceError.code,
      message: serviceError.message,
      details: serviceError.details,
      hint: serviceError.hint,
    })
    return respondWithError(res, serviceError)
  }

  if (!service) {
    return res.status(404).json({ error: 'Service not found' })
  }

  if (
    req.user.role === 'professional' &&
    service.professional_id &&
    service.professional_id !== req.user.id
  ) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const durationMinutes = service.duration_minutes
  if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  const endMinutes = startMinutes + durationMinutes
  if (endMinutes > DAY_END_MINUTES) {
    return res.status(400).json({ error: 'end_time excede o horário permitido' })
  }

  let clientId = req.user.id
  let professionalId = service.professional_id ?? null

  if (req.user.role === 'professional') {
    professionalId = req.user.id
    if (req.body?.client_id) {
      const requestedClientId = String(req.body.client_id)
      if (!isValidUuid(requestedClientId)) {
        return res.status(400).json({ error: 'Invalid client_id' })
      }
      clientId = requestedClientId
    }
  } else if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (!professionalId) {
    return res.status(400).json({ error: 'Invalid professional_id' })
  }

  const startDateTime = `${date}T${startTime}:00.000Z`
  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  const { data: appointments, error: appointmentsError } = await supabaseAdmin
    .from('appointments')
    .select('start_time, end_time, service:services(duration_minutes)')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .eq('professional_id', professionalId)
    .order('start_time', { ascending: true })

  if (appointmentsError) {
    console.error('createAppointment list error', {
      code: appointmentsError.code,
      message: appointmentsError.message,
      details: appointmentsError.details,
      hint: appointmentsError.hint,
    })
    return respondWithError(res, appointmentsError)
  }

  const windows = buildAppointmentWindows(appointments ?? [])
  if (hasCollision(startMinutes, endMinutes, windows)) {
    return res.status(409).json({ error: 'Conflito de horário' })
  }

  const { data: created, error: insertError } = await supabaseAdmin
    .from('appointments')
    .insert({
      service_id: serviceId,
      client_id: clientId,
      professional_id: professionalId,
      start_time: startDateTime,
    })
    .select('*')
    .maybeSingle()

  if (insertError) {
    if (insertError.code === '23P01') {
      return res.status(409).json({ error: 'Conflito de horário' })
    }
    console.error('createAppointment insert error', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    })
    return respondWithError(res, insertError)
  }

  return res.status(201).json({ data: created })
}

export async function updateAppointment(req: Request, res: Response) {
  if (!ensureProfessional(req, res)) {
    return
  }

  const { id } = req.params

  const { data: current, error: currentError } = await supabaseAdmin
    .from('appointments')
    .select('id, start_time, service_id, client_id, professional_id')
    .eq('id', id)
    .maybeSingle()

  if (currentError) {
    console.error('updateAppointment current lookup error', {
      code: currentError.code,
      message: currentError.message,
      details: currentError.details,
      hint: currentError.hint,
    })
    return respondWithError(res, currentError)
  }

  if (!current || current.professional_id !== req.user.id) {
    return res.status(404).json({ error: 'Appointment not found' })
  }

  const providedServiceId = req.body?.service_id
    ? String(req.body.service_id)
    : null
  if (providedServiceId && !isValidUuid(providedServiceId)) {
    return res.status(400).json({ error: 'Invalid service_id' })
  }

  const providedClientId = req.body?.client_id
    ? String(req.body.client_id)
    : null
  if (providedClientId && !isValidUuid(providedClientId)) {
    return res.status(400).json({ error: 'Invalid client_id' })
  }

  const currentParts = current.start_time
    ? parseDateTimeToUtcParts(current.start_time)
    : null
  if (!currentParts) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  const date =
    req.body?.date !== undefined ? String(req.body?.date) : currentParts.date
  const startTime =
    req.body?.start_time !== undefined
      ? String(req.body?.start_time)
      : currentParts.time

  if (!date || !isValidDateString(date)) {
    return res.status(400).json({ error: 'Invalid date' })
  }

  const startMinutes = parseTime(startTime)
  if (startMinutes === null) {
    return res.status(400).json({ error: 'Invalid start_time' })
  }

  if (startMinutes < DAY_START_MINUTES || startMinutes > DAY_END_MINUTES) {
    return res.status(400).json({ error: 'start_time fora do horário permitido' })
  }

  const serviceId = providedServiceId ?? current.service_id
  if (!serviceId) {
    return res.status(400).json({ error: 'Invalid service_id' })
  }

  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('id, duration_minutes, professional_id')
    .eq('id', serviceId)
    .maybeSingle()

  if (serviceError) {
    console.error('updateAppointment service lookup error', {
      code: serviceError.code,
      message: serviceError.message,
      details: serviceError.details,
      hint: serviceError.hint,
    })
    return respondWithError(res, serviceError)
  }

  if (!service) {
    return res.status(404).json({ error: 'Service not found' })
  }

  if (service.professional_id && service.professional_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const durationMinutes = service.duration_minutes
  if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  const endMinutes = startMinutes + durationMinutes
  if (endMinutes > DAY_END_MINUTES) {
    return res.status(400).json({ error: 'end_time excede o horário permitido' })
  }

  const startDateTime = `${date}T${startTime}:00.000Z`
  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  const { data: appointments, error: appointmentsError } = await supabaseAdmin
    .from('appointments')
    .select('id, start_time, end_time, service:services(duration_minutes)')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .neq('id', id)
    .eq('professional_id', req.user.id)
    .order('start_time', { ascending: true })

  if (appointmentsError) {
    console.error('updateAppointment list error', {
      code: appointmentsError.code,
      message: appointmentsError.message,
      details: appointmentsError.details,
      hint: appointmentsError.hint,
    })
    return respondWithError(res, appointmentsError)
  }

  const windows = buildAppointmentWindows(appointments ?? [])
  if (hasCollision(startMinutes, endMinutes, windows)) {
    return res.status(409).json({ error: 'Conflito de horário' })
  }

  const updates: {
    service_id: string
    client_id: string
    start_time: string
    professional_id: string
  } = {
    service_id: serviceId,
    client_id: providedClientId ?? current.client_id,
    start_time: startDateTime,
    professional_id: req.user.id,
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (updateError) {
    console.error('updateAppointment update error', {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    })
    return respondWithError(res, updateError)
  }

  return res.status(200).json({ data: updated })
}

export async function deleteAppointment(req: Request, res: Response) {
  if (!ensureAuthenticated(req, res)) {
    return
  }

  const { id } = req.params

  const { data: appointment, error: appointmentError } = await supabaseAdmin
    .from('appointments')
    .select('id, client_id, start_time, professional_id')
    .eq('id', id)
    .maybeSingle()

  if (appointmentError) {
    console.error('deleteAppointment lookup error', {
      code: appointmentError.code,
      message: appointmentError.message,
      details: appointmentError.details,
      hint: appointmentError.hint,
    })
    return respondWithError(res, appointmentError)
  }

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' })
  }

  if (req.user.role === 'client') {
    if (appointment.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const startTime = appointment.start_time
      ? new Date(appointment.start_time).getTime()
      : null
    if (!startTime) {
      return res.status(500).json({ error: 'Internal Server Error' })
    }

    const limit = Date.now() + 2 * 60 * 60 * 1000
    if (startTime < limit) {
      return res.status(403).json({ error: 'Cancelamento não permitido' })
    }
  } else if (req.user.role !== 'professional') {
    return res.status(403).json({ error: 'Forbidden' })
  } else if (appointment.professional_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { error: deleteError } = await supabaseAdmin
    .from('appointments')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('deleteAppointment delete error', {
      code: deleteError.code,
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint,
    })
    return respondWithError(res, deleteError)
  }

  return res.status(204).send()
}


