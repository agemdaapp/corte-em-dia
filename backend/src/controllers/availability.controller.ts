import type { Request, Response } from 'express'

import { supabaseAdmin } from '../lib/supabase'

const DAY_START_MINUTES = 8 * 60
const DAY_END_MINUTES = 18 * 60
const SLOT_INTERVAL_MINUTES = 15
const DEBUG_ERRORS = process.env.DEBUG_ERRORS === 'true'

type AppointmentWindow = {
  startMinutes: number
  endMinutes: number
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

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function toUtcMinutes(dateTime: string) {
  const parsed = new Date(dateTime)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.getUTCHours() * 60 + parsed.getUTCMinutes()
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

export async function getAvailability(req: Request, res: Response) {
  const serviceId = String(req.query.service_id ?? '')
  const date = String(req.query.date ?? '')

  if (!serviceId || !isValidUuid(serviceId)) {
    return res.status(404).json({ error: 'Service not found' })
  }

  if (!date || !isValidDateString(date)) {
    return res.status(400).json({ error: 'Invalid date' })
  }

  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('id, duration_minutes, professional_id')
    .eq('id', serviceId)
    .maybeSingle()

  if (serviceError) {
    console.error('getAvailability service lookup error', {
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

  const durationMinutes = service.duration_minutes
  if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  const professionalId = service.professional_id
  if (!professionalId) {
    return res.status(400).json({ error: 'Invalid professional_id' })
  }

  const { data: appointments, error: appointmentsError } = await supabaseAdmin
    .from('appointments')
    .select('start_time, end_time, service:services(duration_minutes)')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .eq('professional_id', professionalId)
    .order('start_time', { ascending: true })

  if (appointmentsError) {
    console.error('getAvailability list error', {
      code: appointmentsError.code,
      message: appointmentsError.message,
      details: appointmentsError.details,
      hint: appointmentsError.hint,
    })
    return respondWithError(res, appointmentsError)
  }

  const windows = buildAppointmentWindows(appointments ?? [])
  const availableTimes: string[] = []

  for (
    let minutes = DAY_START_MINUTES;
    minutes <= DAY_END_MINUTES;
    minutes += SLOT_INTERVAL_MINUTES
  ) {
    const endMinutes = minutes + durationMinutes
    if (endMinutes > DAY_END_MINUTES) {
      break
    }

    if (!hasCollision(minutes, endMinutes, windows)) {
      availableTimes.push(formatTime(minutes))
    }
  }

  return res.status(200).json({
    date,
    service_id: serviceId,
    duration_minutes: durationMinutes,
    available_times: availableTimes,
  })
}


