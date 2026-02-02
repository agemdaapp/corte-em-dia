import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import TopNav from '../components/TopNav'
import { logoutAndRedirect } from '../utils/logout'

type ServiceApi = {
  id: string
  name: string
  duration_minutes: number
  price: number | null
}

type ProfessionalApi = {
  id: string
  name: string | null
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
    price: service.price ?? null,
  }))
}

function ClientServices() {
  const navigate = useNavigate()
  const [services, setServices] = useState<ServiceApi[]>([])
  const [professionals, setProfessionals] = useState<ProfessionalApi[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasServices = useMemo(() => services.length > 0, [services.length])

  useEffect(() => {
    const loadProfessionals = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await api.get('/professionals')
        const list = Array.isArray((response.data as { data?: unknown })?.data)
          ? ((response.data as { data: ProfessionalApi[] }).data ?? [])
          : []
        setProfessionals(list)
        if (list.length > 0) {
          setSelectedProfessional(list[0].id)
        }
      } catch (requestError) {
        setError('Não foi possível carregar os profissionais.')
      } finally {
        setLoading(false)
      }
    }

    loadProfessionals()
  }, [])

  useEffect(() => {
    const loadServices = async () => {
      if (!selectedProfessional) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await api.get('/services', {
          params: { professional_id: selectedProfessional },
        })
        setServices(mapServices(response.data))
      } catch (requestError) {
        setError('Não foi possível carregar os serviços.')
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [selectedProfessional])

  async function handleSignOut() {
    await logoutAndRedirect(navigate)
  }

  const handleSelect = (serviceId: string) => {
    navigate(`/cliente/agendar?service=${serviceId}`)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <TopNav
        title="Agendamentos"
        items={[
          { label: 'Serviços', to: '/cliente/servicos' },
          { label: 'Meus agendamentos', to: '/cliente/meus-agendamentos' },
          { label: 'Sair', onClick: handleSignOut },
        ]}
      />
      <div className="max-w-4xl mx-auto space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Escolha de Serviço
          </h1>
          <p className="text-slate-500 mt-1">
            Selecione o serviço para continuar o agendamento.
          </p>
        </div>

        {professionals.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="professional">
              Profissional
            </label>
            <select
              id="professional"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
              value={selectedProfessional}
              onChange={(event) => setSelectedProfessional(event.target.value)}
            >
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name ?? 'Profissional'}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm animate-pulse space-y-2"
              >
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {!loading && selectedProfessional && !hasServices && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-slate-500">
            Nenhum serviço disponível no momento.
          </div>
        )}

        {hasServices && (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {service.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {service.duration_minutes} min
                  </p>
                  {service.price !== null && (
                    <p className="text-sm text-slate-700 mt-1">
                      R$ {service.price.toFixed(2)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="self-start px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => handleSelect(service.id)}
                >
                  Selecionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientServices