import type { Request, Response } from 'express'

import { supabase } from '../lib/supabase'

const DAY_START_MINUTES = 8 * 60
const DAY_END_MINUTES = 18 * 60

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

function buildAppointmentWindows(rows: Array<{
  start_time: string | null
  end_time: string | null
  duration_minutes?: number | null
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

    if (endMinutes === null && row.duration_minutes) {
      endMinutes = startMinutes + row.duration_minutes
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

  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, start_time, end_time, service:services(name, duration_minutes), client:profiles(name)'
    )
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time', { ascending: true })

  if (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  const normalized = (data ?? []).map((item) => {
    const duration =
      item.service && typeof item.service.duration_minutes === 'number'
        ? item.service.duration_minutes
        : null
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

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, duration_minutes')
    .eq('id', serviceId)
    .maybeSingle()

  if (serviceError) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  if (!service) {
    return res.status(404).json({ error: 'Service not found' })
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

  if (req.user.role === 'professional') {
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

  const startDateTime = `${date}T${startTime}:00.000Z`
  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('start_time, end_time, duration_minutes')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time', { ascending: true })

  if (appointmentsError) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  const windows = buildAppointmentWindows(appointments ?? [])
  if (hasCollision(startMinutes, endMinutes, windows)) {
    return res.status(409).json({ error: 'Conflito de horário' })
  }

  const { data: created, error: insertError } = await supabase
    .from('appointments')
    .insert({
      service_id: serviceId,
      client_id: clientId,
      start_time: startDateTime,
    })
    .select('*')
    .maybeSingle()

  if (insertError) {
    if (insertError.code === '23P01') {
      return res.status(409).json({ error: 'Conflito de horário' })
    }
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  return res.status(201).json({ data: created })
}


