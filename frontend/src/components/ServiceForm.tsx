import { FormEvent, useEffect, useState } from 'react'

type ServiceFormValues = {
  id?: string
  name: string
  duration_minutes: number
  price?: number | null
}

type ServiceFormProps = {
  initialValues?: ServiceFormValues | null
  loading: boolean
  onSubmit: (values: ServiceFormValues) => Promise<void>
  onCancel: () => void
}

function ServiceForm({ initialValues, loading, onSubmit, onCancel }: ServiceFormProps) {
  const [name, setName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialValues) {
      setName('')
      setDurationMinutes('')
      setPrice('')
      return
    }

    setName(initialValues.name ?? '')
    setDurationMinutes(
      Number.isFinite(initialValues.duration_minutes)
        ? String(initialValues.duration_minutes)
        : ''
    )
    setPrice(
      typeof initialValues.price === 'number' && Number.isFinite(initialValues.price)
        ? String(initialValues.price)
        : ''
    )
  }, [initialValues])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!name.trim() || !durationMinutes.trim()) {
      setError('Preencha os campos obrigatórios.')
      return
    }

    const parsedDuration = Number(durationMinutes)
    const parsedPrice = price.trim() ? Number(price) : null

    if (!Number.isFinite(parsedDuration)) {
      setError('Duração inválida.')
      return
    }

    if (price.trim() && !Number.isFinite(parsedPrice)) {
      setError('Preço inválido.')
      return
    }

    await onSubmit({
      id: initialValues?.id,
      name: name.trim(),
      duration_minutes: parsedDuration,
      price: parsedPrice,
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="service-name">
          Nome do serviço
        </label>
        <input
          id="service-name"
          type="text"
          className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="service-duration">
          Duração (min)
        </label>
        <input
          id="service-duration"
          type="number"
          min="1"
          className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(event.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="service-price">
          Preço (opcional)
        </label>
        <input
          id="service-price"
          type="number"
          min="0"
          step="0.01"
          className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

export type { ServiceFormValues }
export default ServiceForm


