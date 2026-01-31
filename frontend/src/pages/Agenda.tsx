import { useEffect, useMemo, useState } from 'react'

import AppointmentCard from '../components/AppointmentCard'
import DayNavigator from '../components/DayNavigator'
import api from '../services/api'

type AppointmentApi = {
  id?: string
  start_time?: string | null
  end_time?: string | null
  service?: { name?: string | null } | null
  client?: { name?: string | null } | null
  service_name?: string | null
  client_name?: string | null
}

type AppointmentView = {
  id: string
  startTime: string
  endTime: string
  serviceName: string
  clientName: string
}

function getToday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(value?: string | null) {
  if (!value) {
    return ''
  }

  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (match) {
    return value
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function mapAppointments(payload: unknown): AppointmentView[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? (payload as { data: unknown[] }).data
      : []

  return (list as AppointmentApi[]).map((item, index) => {
    const startTime = formatTime(item.start_time)
    const endTime = formatTime(item.end_time)

    return {
      id: item.id ?? `${item.start_time ?? 'start'}-${index}`,
      startTime: startTime || '--:--',
      endTime: endTime || '--:--',
      serviceName: item.service?.name ?? item.service_name ?? 'Serviço',
      clientName: item.client?.name ?? item.client_name ?? 'Cliente',
    }
  })
}

function Agenda() {
  const [selectedDate, setSelectedDate] = useState(getToday)
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<AppointmentView[]>([])

  useEffect(() => {
    const controller = new AbortController()

    const loadAppointments = async () => {
      setLoading(true)

      try {
        const response = await api.get('/appointments', {
          params: { date: selectedDate },
          signal: controller.signal,
        })

        setAppointments(mapAppointments(response.data))
      } catch (error) {
        if (!controller.signal.aborted) {
          setAppointments([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadAppointments()

    return () => {
      controller.abort()
    }
  }, [selectedDate])

  const hasAppointments = useMemo(
    () => appointments.length > 0,
    [appointments.length]
  )

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Agenda do Dia</h1>
            <p className="text-slate-500 mt-1">
              Visualize os horários já ocupados.
            </p>
          </div>
        </div>

        <DayNavigator
          selectedDate={selectedDate}
          onChange={setSelectedDate}
          loading={loading}
        />

        {loading ? (
          <div className="text-slate-500">Carregando agendamentos...</div>
        ) : (
          <div className="space-y-3">
            {hasAppointments ? (
              appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  startTime={appointment.startTime}
                  endTime={appointment.endTime}
                  serviceName={appointment.serviceName}
                  clientName={appointment.clientName}
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-slate-500">
                Nenhum agendamento para este dia
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Agenda

