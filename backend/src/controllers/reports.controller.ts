import type { Request, Response } from 'express'

import { supabase } from '../lib/supabase'

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

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime())
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function formatDate(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getSummaryReport(req: Request, res: Response) {
  if (!ensureProfessional(req, res)) {
    return
  }

  const startParam = String(req.query.start ?? '')
  const endParam = String(req.query.end ?? '')

  const today = new Date()
  const defaultStart = formatDate(addDays(today, -30))
  const defaultEnd = formatDate(today)

  const startDate = startParam && isValidDateString(startParam) ? startParam : defaultStart
  const endDate = endParam && isValidDateString(endParam) ? endParam : defaultEnd

  const startOfDay = `${startDate}T00:00:00.000Z`
  const endOfDay = `${endDate}T23:59:59.999Z`

  const { data, error } = await supabase
    .from('appointments')
    .select('id, start_time, end_time, service:services(name, duration_minutes)')
    .eq('professional_id', req.user.id)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)

  if (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  const appointments = data ?? []
  let totalMinutes = 0
  const servicesCount: Record<string, number> = {}

  for (const item of appointments as Array<{
    service?: { name?: string | null; duration_minutes?: number | null } | null
    start_time?: string | null
    end_time?: string | null
  }>) {
    const duration =
      item.service?.duration_minutes && typeof item.service.duration_minutes === 'number'
        ? item.service.duration_minutes
        : 0
    totalMinutes += duration

    const serviceName = item.service?.name ?? 'Serviço'
    servicesCount[serviceName] = (servicesCount[serviceName] ?? 0) + 1
  }

  const topServices = Object.entries(servicesCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return res.status(200).json({
    start_date: startDate,
    end_date: endDate,
    total_appointments: appointments.length,
    total_hours: Math.round((totalMinutes / 60) * 100) / 100,
    top_services: topServices,
  })
}

