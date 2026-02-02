import { useEffect, useMemo, useState } from 'react'

import AppointmentCard from '../components/AppointmentCard'
import DayNavigator from '../components/DayNavigator'
import TopNav from '../components/TopNav'
import api from '../services/api'
import { logoutAndRedirect } from '../utils/logout'
import { useNavigate } from 'react-router-dom'

type AppointmentApi = {
  id?: string
  start_time?: string | null
  end_time?: string | null
  service_id?: string | null
  client_id?: string | null
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
  serviceId: string
  clientId: string
  startTimeRaw: string | null
}

type ServiceOption = {
  id: string
  name: string
}

type ClientOption = {
  id: string
  name: string
}

type AppointmentFormState = {
  serviceId: string
  clientId: string
  date: string
  startTime: string
}

const DAY_START_MINUTES = 8 * 60
const DAY_END_MINUTES = 18 * 60
const SLOT_INTERVAL_MINUTES = 15

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

function parseTimeToMinutes(value: string) {
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

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function parseDateTimeToUtcParts(dateTime: string | null) {
  if (!dateTime) {
    return null
  }

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
      serviceId: item.service_id ?? '',
      clientId: item.client_id ?? '',
      startTimeRaw: item.start_time ?? null,
    }
  })
}

function Agenda() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(getToday)
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<AppointmentView[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formValues, setFormValues] = useState<AppointmentFormState>({
    serviceId: '',
    clientId: '',
    date: getToday(),
    startTime: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceOption[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])

  const loadAppointments = async (signal?: AbortSignal) => {
    setLoading(true)

    try {
      const response = await api.get('/appointments', {
        params: { date: selectedDate },
        signal,
      })

      setAppointments(mapAppointments(response.data))
    } catch (error) {
      if (!signal?.aborted) {
        setAppointments([])
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    loadAppointments(controller.signal)

    return () => {
      controller.abort()
    }
  }, [selectedDate])

  const hasAppointments = useMemo(
    () => appointments.length > 0,
    [appointments.length]
  )

  const freeSlots = useMemo(() => {
    const windows = appointments
      .map((appointment) => {
        const start = parseTimeToMinutes(appointment.startTime)
        const end = parseTimeToMinutes(appointment.endTime)
        if (start === null || end === null) {
          return null
        }
        return { start, end }
      })
      .filter((value): value is { start: number; end: number } => Boolean(value))
      .sort((a, b) => a.start - b.start)

    const slots: string[] = []

    for (
      let minutes = DAY_START_MINUTES;
      minutes <= DAY_END_MINUTES;
      minutes += SLOT_INTERVAL_MINUTES
    ) {
      const slotEnd = minutes + SLOT_INTERVAL_MINUTES
      if (slotEnd > DAY_END_MINUTES) {
        break
      }

      const hasCollision = windows.some(
        (window) => minutes < window.end && slotEnd > window.start
      )
      if (!hasCollision) {
        slots.push(formatMinutes(minutes))
      }
    }

    return slots
  }, [appointments])

  const loadServicesAndClients = async () => {
    setFormLoading(true)
    setFormError(null)

    try {
      const [servicesResponse, clientsResponse] = await Promise.all([
        api.get('/services'),
        api.get('/clients'),
      ])

      const servicesData = Array.isArray(
        (servicesResponse.data as { data?: unknown })?.data
      )
        ? ((servicesResponse.data as { data: ServiceOption[] }).data ?? [])
        : []

      const clientsData = Array.isArray(
        (clientsResponse.data as { data?: unknown })?.data
      )
        ? ((clientsResponse.data as { data: ClientOption[] }).data ?? [])
        : []

      setServices(servicesData)
      setClients(clientsData)
    } catch (error) {
      setFormError('Não foi possível carregar serviços e clientes.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleSignOut() {
    await logoutAndRedirect(navigate)
  }


  const handleOpenCreate = async () => {
    setFormMode('create')
    setEditingId(null)
    setFormValues({
      serviceId: '',
      clientId: '',
      date: selectedDate,
      startTime: '',
    })
    setFormOpen(true)
    setFormError(null)
    setFeedback(null)
    await loadServicesAndClients()
  }

  const handleOpenEdit = async (appointment: AppointmentView) => {
    const parts = parseDateTimeToUtcParts(appointment.startTimeRaw)
    setFormMode('edit')
    setEditingId(appointment.id)
    setFormValues({
      serviceId: appointment.serviceId,
      clientId: appointment.clientId,
      date: parts?.date ?? selectedDate,
      startTime: parts?.time ?? '',
    })
    setFormOpen(true)
    setFormError(null)
    setFeedback(null)
    await loadServicesAndClients()
  }

  const handleCloseForm = () => {
    if (!formLoading) {
      setFormOpen(false)
      setFormError(null)
    }
  }

  const handleFormChange = (field: keyof AppointmentFormState, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setFormLoading(true)
    setFormError(null)
    setFeedback(null)

    if (!formValues.serviceId || !formValues.clientId || !formValues.startTime) {
      setFormLoading(false)
      setFormError('Preencha serviço, cliente e horário.')
      return
    }

    try {
      if (formMode === 'create') {
        await api.post('/appointments', {
          service_id: formValues.serviceId,
          client_id: formValues.clientId,
          date: formValues.date,
          start_time: formValues.startTime,
        })
        setFeedback('Agendamento criado com sucesso.')
      } else if (editingId) {
        await api.put(`/appointments/${editingId}`, {
          service_id: formValues.serviceId,
          client_id: formValues.clientId,
          date: formValues.date,
          start_time: formValues.startTime,
        })
        setFeedback('Agendamento atualizado com sucesso.')
      }

      setFormOpen(false)
      await loadAppointments()
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setFormError('Conflito de horário. Escolha outro horário.')
      } else {
        setFormError('Não foi possível salvar o agendamento.')
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (appointmentId: string) => {
    const confirmed = window.confirm('Deseja realmente cancelar este agendamento?')
    if (!confirmed) {
      return
    }

    try {
      await api.delete(`/appointments/${appointmentId}`)
      setFeedback('Agendamento cancelado com sucesso.')
      await loadAppointments()
    } catch (error) {
      setFormError('Não foi possível cancelar o agendamento.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <TopNav
        items={[
          { label: 'Agenda', to: '/agenda' },
          { label: 'Serviços', to: '/services' },
          { label: 'Clientes', to: '/clients' },
          { label: 'Relatórios', to: '/reports' },
          { label: 'Sair', onClick: handleSignOut },
        ]}
      />
      <div className="max-w-4xl mx-auto space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Agenda do Dia</h1>
            <p className="text-slate-500 mt-1">
              Visualize e organize os horários já ocupados.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
              onClick={handleOpenCreate}
            >
              Novo agendamento
            </button>
          </div>
        </div>

        {feedback && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-sm">
            {feedback}
          </div>
        )}

        <DayNavigator
          selectedDate={selectedDate}
          onChange={setSelectedDate}
          loading={loading}
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm animate-pulse space-y-2"
              >
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {hasAppointments ? (
                appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    startTime={appointment.startTime}
                    endTime={appointment.endTime}
                    serviceName={appointment.serviceName}
                    clientName={appointment.clientName}
                    onEdit={() => handleOpenEdit(appointment)}
                    onCancel={() => handleDelete(appointment.id)}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-slate-500">
                  Nenhum agendamento para este dia
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-medium text-slate-900">
                Horários livres
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Intervalo exibido entre 08:00 e 18:00.
              </div>
              {freeSlots.length === 0 ? (
                <div className="text-slate-500 mt-3">
                  Nenhum horário livre disponível.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-3">
                  {freeSlots.map((slot) => (
                    <span
                      key={slot}
                      className="px-3 py-1 rounded-md border border-slate-200 text-sm text-slate-700"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {formMode === 'create' ? 'Novo agendamento' : 'Editar agendamento'}
            </h2>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="service">
                  Serviço
                </label>
                <select
                  id="service"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                  value={formValues.serviceId}
                  onChange={(event) => handleFormChange('serviceId', event.target.value)}
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="client">
                  Cliente
                </label>
                <select
                  id="client"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                  value={formValues.clientId}
                  onChange={(event) => handleFormChange('clientId', event.target.value)}
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="date">
                    Data
                  </label>
                  <input
                    id="date"
                    type="date"
                    className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                    value={formValues.date}
                    onChange={(event) => handleFormChange('date', event.target.value)}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700" htmlFor="time">
                    Hora
                  </label>
                  <input
                    id="time"
                    type="time"
                    className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                    value={formValues.startTime}
                    onChange={(event) => handleFormChange('startTime', event.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                onClick={handleSubmit}
                disabled={formLoading}
              >
                {formLoading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={handleCloseForm}
                disabled={formLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Agenda

