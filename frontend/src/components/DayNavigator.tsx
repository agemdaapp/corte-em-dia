type DayNavigatorProps = {
  selectedDate: string
  onChange: (nextDate: string) => void
  loading: boolean
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  return new Date(year, month - 1, day)
}

function formatLabel(value: string) {
  const date = parseDate(value)
  if (!date) {
    return value
  }
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function addDays(value: string, amount: number) {
  const date = parseDate(value)
  if (!date) {
    return value
  }
  date.setDate(date.getDate() + amount)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function DayNavigator({ selectedDate, onChange, loading }: DayNavigatorProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        className="px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        onClick={() => onChange(addDays(selectedDate, -1))}
        disabled={loading}
      >
        Anterior
      </button>

      <div className="text-slate-700 font-medium text-sm sm:text-base">
        {formatLabel(selectedDate)}
      </div>

      <button
        type="button"
        className="px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        onClick={() => onChange(addDays(selectedDate, 1))}
        disabled={loading}
      >
        Próximo
      </button>
    </div>
  )
}

export default DayNavigator


