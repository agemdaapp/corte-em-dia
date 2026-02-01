import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../services/api'

type AppointmentApi = {
  id: string
  start_time?: string | null
  end_time?: string | null
  service?: { name?: string | null } | null
}

type AppointmentView = {
  id: string
  dateLabel: string
  timeLabel: string
  serviceName: string
  startTime?: string | null
}

function formatDateTime(startTime?: string | null, endTime?: string | null) {
  if (!startTime) {
    return { dateLabel: '--/--/----', timeLabel: '--:--' }
  }

  const startDate = new Date(startTime)
  const endDate = endTime ? new Date(endTime) : null

  const dateLabel = startDate.toLocaleDateString('pt-BR')
  const startLabel = startDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const endLabel = endDate
    ? endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return {
    dateLabel,
    timeLabel: endLabel ? `${startLabel} - ${endLabel}` : startLabel,
  }
}

function mapAppointments(payload: unknown): AppointmentView[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? (payload as { data: unknown[] }).data
      : []

  return (list as AppointmentApi[]).map((item, index) => {
    const { dateLabel, timeLabel } = formatDateTime(
      item.start_time ?? null,
      item.end_time ?? null
    )

    return {
      id: item.id ?? `${item.start_time ?? 'start'}-${index}`,
      dateLabel,
      timeLabel,
      serviceName: item.service?.name ?? 'Serviço',
      startTime: item.start_time ?? null,
    }
  })
}

function MyAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<AppointmentView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const hasAppointments = useMemo(
    () => appointments.length > 0,
    [appointments.length]
  )

  const loadAppointments = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/appointments/me')
      setAppointments(mapAppointments(response.data))
    } catch (requestError) {
      setError('Não foi possível carregar seus agendamentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const handleCancel = async (appointmentId: string) => {
    setError(null)
    setFeedback(null)

    const confirmed = window.confirm(
      'Deseja realmente cancelar este agendamento?'
    )
    if (!confirmed) {
      return
    }

    try {
      await api.delete(`/appointments/${appointmentId}`)
      setFeedback('Agendamento cancelado com sucesso.')
      await loadAppointments()
    } catch (requestError: any) {
      if (requestError?.response?.status === 403) {
        setError('Cancelamento permitido apenas com 2 horas de antecedência.')
        return
      }
      setError('Não foi possível cancelar o agendamento.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Meus Agendamentos
            </h1>
            <p className="text-slate-500 mt-1">
              Acompanhe seus horários confirmados.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Cancelamentos são permitidos com no mínimo 2 horas de antecedência.
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => navigate('/cliente/servicos')}
          >
            Novo agendamento
          </button>
        </div>

        {feedback && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-sm">
            {feedback}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-slate-500">Carregando agendamentos...</div>
        )}

        {!loading && !hasAppointments && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-slate-500">
            Nenhum agendamento futuro encontrado.
          </div>
        )}

        {hasAppointments && (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-slate-900 font-semibold">
                    {appointment.dateLabel}
                  </div>
                  <div className="text-slate-600 text-sm">
                    {appointment.timeLabel}
                  </div>
                  <div className="text-slate-500 text-sm">
                    {appointment.serviceName}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleCancel(appointment.id)}
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyAppointments

