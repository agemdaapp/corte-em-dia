import type { Request, Response } from 'express'

import { supabase } from '../lib/supabase'

const DAY_START_MINUTES = 8 * 60
const DAY_END_MINUTES = 18 * 60
const SLOT_INTERVAL_MINUTES = 15

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

export async function getAvailability(req: Request, res: Response) {
  const serviceId = String(req.query.service_id ?? '')
  const date = String(req.query.date ?? '')

  if (!serviceId || !isValidUuid(serviceId)) {
    return res.status(404).json({ error: 'Service not found' })
  }

  if (!date || !isValidDateString(date)) {
    return res.status(400).json({ error: 'Invalid date' })
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


