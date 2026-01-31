type ServiceCardProps = {
  name: string
  durationMinutes: number
  price: number | null
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
}

function ServiceCard({
  name,
  durationMinutes,
  price,
  onEdit,
  onDelete,
  loading = false,
}: ServiceCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        <p className="text-sm text-slate-500">{durationMinutes} min</p>
        {price !== null && (
          <p className="text-sm text-slate-700 mt-1">R$ {price.toFixed(2)}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          onClick={onEdit}
          disabled={loading}
        >
          Editar
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
          onClick={onDelete}
          disabled={loading}
        >
          Excluir
        </button>
      </div>
    </div>
  )
}

export default ServiceCard


