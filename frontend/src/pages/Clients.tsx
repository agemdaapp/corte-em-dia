import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../services/api'

type ClientApi = {
  id: string
  name: string
  email: string
  phone?: string | null
}

type ClientFormValues = {
  id?: string
  name: string
  email: string
  phone: string
  password: string
}

function mapClients(payload: unknown): ClientApi[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? (payload as { data: unknown[] }).data
      : []

  return (list as ClientApi[]).map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone ?? null,
  }))
}

function Clients() {
  const [clients, setClients] = useState<ClientApi[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientApi | null>(null)
  const [formValues, setFormValues] = useState<ClientFormValues>({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  const hasClients = useMemo(() => clients.length > 0, [clients.length])

  const loadClients = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/clients')
      setClients(mapClients(response.data))
    } catch (requestError) {
      setError('Não foi possível carregar os clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const handleOpenCreate = () => {
    setEditingClient(null)
    setFormValues({ name: '', email: '', phone: '', password: '' })
    setIsFormOpen(true)
    setFeedback(null)
  }

  const handleOpenEdit = (client: ClientApi) => {
    setEditingClient(client)
    setFormValues({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone ?? '',
      password: '',
    })
    setIsFormOpen(true)
    setFeedback(null)
  }

  const handleCloseForm = () => {
    if (!loading) {
      setIsFormOpen(false)
    }
  }

  const handleChange = (field: keyof ClientFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      if (editingClient) {
        const payload: Record<string, string> = {
          name: formValues.name,
          email: formValues.email,
          phone: formValues.phone,
        }
        if (formValues.password.trim()) {
          payload.password = formValues.password
        }

        await api.put(`/clients/${editingClient.id}`, payload)
        setFeedback('Cliente atualizado com sucesso.')
      } else {
        await api.post('/clients', {
          name: formValues.name,
          email: formValues.email,
          phone: formValues.phone || null,
          password: formValues.password,
        })
        setFeedback('Cliente criado com sucesso.')
      }

      setIsFormOpen(false)
      await loadClients()
    } catch (requestError) {
      setError('Não foi possível salvar o cliente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (clientId: string) => {
    if (loading) {
      return
    }

    const confirmed = window.confirm('Deseja realmente excluir este cliente?')
    if (!confirmed) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.delete(`/clients/${clientId}`)
      setFeedback('Cliente excluído com sucesso.')
      await loadClients()
    } catch (requestError) {
      setError('Não foi possível excluir o cliente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
            <p className="text-slate-500 mt-1">
              Cadastre e organize sua base de clientes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
              onClick={handleOpenCreate}
              disabled={loading}
            >
              Novo cliente
            </button>
            <Link
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
              to="/agenda"
            >
              Agenda
            </Link>
            <Link
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
              to="/services"
            >
              Serviços
            </Link>
          </div>
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
          <div className="text-slate-500">Carregando clientes...</div>
        )}

        {!loading && !hasClients && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-slate-500">
            Nenhum cliente cadastrado.
          </div>
        )}

        {hasClients && (
          <div className="grid gap-4 sm:grid-cols-2">
            {clients.map((client) => (
              <div
                key={client.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {client.name}
                  </h3>
                  <p className="text-sm text-slate-500">{client.email}</p>
                  {client.phone && (
                    <p className="text-sm text-slate-500">{client.phone}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    onClick={() => handleOpenEdit(client)}
                    disabled={loading}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    onClick={() => handleDelete(client.id)}
                    disabled={loading}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingClient ? 'Editar cliente' : 'Novo cliente'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="name">
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                  value={formValues.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                  value={formValues.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="phone">
                  Telefone
                </label>
                <input
                  id="phone"
                  type="text"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                  value={formValues.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="password"
                >
                  {editingClient ? 'Nova senha (opcional)' : 'Senha inicial'}
                </label>
                <input
                  id="password"
                  type="password"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                  value={formValues.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  required={!editingClient}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={handleCloseForm}
                disabled={loading}
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

export default Clients

