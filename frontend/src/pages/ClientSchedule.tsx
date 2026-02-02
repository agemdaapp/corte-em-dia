import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import api from '../services/api'
import TopNav from '../components/TopNav'

type ServiceApi = {
  id: string
  name: string
  duration_minutes: number
}

type AvailabilityResponse = {
  available_times: string[]
}

function mapServices(payload: unknown): ServiceApi[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? (payload as { data: unknown[] }).data
      : []

  return (list as ServiceApi[]).map((service) => ({
    id: service.id,
    name: service.name,
    duration_minutes: service.duration_minutes,
  }))
}

function getToday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ClientSchedule() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const serviceId = searchParams.get('service_id') ?? ''
  const professionalId = searchParams.get('professional_id')

  const [services, setServices] = useState<ServiceApi[]>([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState(getToday)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadServices = async () => {
      if (!professionalId) {
        setError('Profissional não informado.')
        return
      }

      setLoadingServices(true)
      setError(null)

      try {
        const response = await api.get('/services', {
          params: { professional_id: professionalId },
        })
        setServices(mapServices(response.data))
      } catch (requestError) {
        setError('Não foi possível carregar os serviços.')
      } finally {
        setLoadingServices(false)
      }
    }

    loadServices()
  }, [professionalId])

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? null,
    [services, serviceId]
  )

  useEffect(() => {
    const loadAvailability = async () => {
      if (!serviceId || !selectedDate) {
        return
      }

      setLoadingTimes(true)
      setError(null)
      setSelectedTime(null)

      try {
        const response = await api.get<AvailabilityResponse>('/availability', {
          params: {
            service_id: serviceId,
            date: selectedDate,
          },
        })
        setAvailableTimes(response.data.available_times ?? [])
      } catch (requestError) {
        setError('Não foi possível carregar os horários disponíveis.')
        setAvailableTimes([])
      } finally {
        setLoadingTimes(false)
      }
    }

    loadAvailability()
  }, [serviceId, selectedDate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setFeedback(null)

    if (!selectedTime) {
      setError('Selecione um horário disponível.')
      return
    }

    setSubmitting(true)

    try {
      await api.post('/appointments', {
        service_id: serviceId,
        date: selectedDate,
        start_time: selectedTime,
      })
      setFeedback('Agendamento confirmado com sucesso.')
      navigate('/cliente/meus-agendamentos', { replace: true })
    } catch (requestError) {
      setError('Não foi possível confirmar o agendamento.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-slate-100">
        <TopNav
          title="Agendamentos"
          items={[
            { label: 'Serviços', to: '/cliente/servicos' },
            { label: 'Meus agendamentos', to: '/cliente/meus-agendamentos' },
          ]}
        />
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
            Serviço inválido. Retorne para escolher um serviço.
            <button
              type="button"
              className="mt-4 inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => navigate('/cliente/servicos')}
            >
              Voltar para serviços
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <TopNav
        title="Corte em Dia - Agendamentos"
        items={[
          { label: 'Serviços', to: '/cliente/servicos' },
          { label: 'Meus agendamentos', to: '/cliente/meus-agendamentos' },
        ]}
      />
      <div className="max-w-4xl mx-auto space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Seleção de Data e Horário
          </h1>
          <p className="text-slate-500 mt-1">
            Escolha o melhor horário para o seu atendimento.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {feedback && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-sm">
            {feedback}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-slate-500">Serviço selecionado</span>
            {loadingServices ? (
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            ) : (
              <div className="text-lg font-semibold text-slate-900">
                {selectedService?.name ?? 'Serviço'}
              </div>
            )}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="date">
                Data
              </label>
              <input
                id="date"
                type="date"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">
                Horários disponíveis
              </div>
              {loadingTimes ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="h-8 w-16 rounded-md bg-slate-200 animate-pulse"
                    />
                  ))}
                </div>
              ) : availableTimes.length === 0 ? (
                <div className="text-slate-500">
                  Nenhum horário disponível para esta data.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTimes.map((time) => (
                    <button
                      type="button"
                      key={time}
                      className={`px-3 py-1.5 rounded-md border text-sm ${
                        selectedTime === time
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                disabled={submitting || loadingTimes}
              >
                {submitting ? 'Confirmando...' : 'Confirmar agendamento'}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => navigate('/cliente/servicos')}
              >
                Trocar serviço
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ClientSchedule

