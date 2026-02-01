import { useEffect, useState } from 'react'

import api from '../services/api'

type ReportResponse = {
  start_date: string
  end_date: string
  total_appointments: number
  total_hours: number
  top_services: Array<{ name: string; count: number }>
}

function getToday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPastDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function Reports() {
  const [startDate, setStartDate] = useState(getPastDate(30))
  const [endDate, setEndDate] = useState(getToday)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReportResponse | null>(null)

  const loadReport = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<ReportResponse>('/reports/summary', {
        params: { start: startDate, end: endDate },
      })
      setReport(response.data)
    } catch (requestError) {
      setError('Não foi possível carregar os relatórios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Relatórios</h1>
          <p className="text-slate-500 mt-1">
            Acompanhe os serviços mais realizados e o volume de atendimentos.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="start">
              Início
            </label>
            <input
              id="start"
              type="date"
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="end">
              Fim
            </label>
            <input
              id="end"
              type="date"
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
            onClick={loadReport}
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {loading && <div className="text-slate-500">Carregando relatório...</div>}

        {report && !loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">Total de agendamentos</div>
              <div className="text-2xl font-semibold text-slate-900">
                {report.total_appointments}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">Horas atendidas</div>
              <div className="text-2xl font-semibold text-slate-900">
                {report.total_hours}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 sm:col-span-2">
              <div className="text-sm text-slate-500 mb-3">Serviços mais realizados</div>
              {report.top_services.length === 0 ? (
                <div className="text-slate-500">Nenhum serviço no período.</div>
              ) : (
                <div className="space-y-2">
                  {report.top_services.map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between text-slate-700"
                    >
                      <span>{service.name}</span>
                      <span className="font-medium">{service.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports

