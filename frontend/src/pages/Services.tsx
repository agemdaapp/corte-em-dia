import { useEffect, useMemo, useState } from 'react'

import ServiceCard from '../components/ServiceCard'
import ServiceForm, { ServiceFormValues } from '../components/ServiceForm'
import api from '../services/api'

type ServiceApi = {
  id: string
  name: string
  duration_minutes: number
  price?: number | null
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

function Services() {
  const [services, setServices] = useState<ServiceApi[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceApi | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const hasServices = useMemo(() => services.length > 0, [services.length])

  const loadServices = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/services')
      setServices(mapServices(response.data))
    } catch (requestError) {
      setError('Não foi possível carregar os serviços.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleOpenCreate = () => {
    setEditingService(null)
    setIsFormOpen(true)
    setFeedback(null)
  }

  const handleOpenEdit = (service: ServiceApi) => {
    setEditingService(service)
    setIsFormOpen(true)
    setFeedback(null)
  }

  const handleCloseForm = () => {
    if (!loading) {
      setIsFormOpen(false)
    }
  }

  const handleSubmit = async (values: ServiceFormValues) => {
    setLoading(true)
    setError(null)

    try {
      if (values.id) {
        await api.put(`/services/${values.id}`, {
          name: values.name,
          duration_minutes: values.duration_minutes,
          price: values.price,
        })
        setFeedback('Serviço atualizado com sucesso.')
      } else {
        await api.post('/services', {
          name: values.name,
          duration_minutes: values.duration_minutes,
          price: values.price,
        })
        setFeedback('Serviço criado com sucesso.')
      }

      setIsFormOpen(false)
      await loadServices()
    } catch (requestError) {
      setError('Não foi possível salvar o serviço.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (loading) {
      return
    }

    const confirmed = window.confirm('Deseja realmente excluir este serviço?')
    if (!confirmed) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.delete(`/services/${serviceId}`)
      setFeedback('Serviço excluído com sucesso.')
      await loadServices()
    } catch (requestError) {
      setError('Não foi possível excluir o serviço.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Serviços</h1>
            <p className="text-slate-500 mt-1">
              Gerencie os serviços oferecidos no salão.
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            onClick={handleOpenCreate}
            disabled={loading}
          >
            Novo serviço
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

        {loading && !isFormOpen && (
          <div className="text-slate-500">Carregando serviços...</div>
        )}

        {!loading && !hasServices && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-slate-500">
            Nenhum serviço cadastrado.
          </div>
        )}

        {hasServices && (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                name={service.name}
                durationMinutes={service.duration_minutes}
                price={service.price ?? null}
                loading={loading}
                onEdit={() => handleOpenEdit(service)}
                onDelete={() => handleDelete(service.id)}
              />
            ))}
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {editingService ? 'Editar serviço' : 'Novo serviço'}
            </h2>
            <ServiceForm
              initialValues={
                editingService
                  ? {
                      id: editingService.id,
                      name: editingService.name,
                      duration_minutes: editingService.duration_minutes,
                      price: editingService.price ?? null,
                    }
                  : null
              }
              loading={loading}
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Services

