type AppointmentCardProps = {
  startTime: string
  endTime: string
  serviceName: string
  clientName: string
  onEdit?: () => void
  onCancel?: () => void
}

function AppointmentCard({
  startTime,
  endTime,
  serviceName,
  clientName,
  onEdit,
  onCancel,
}: AppointmentCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-slate-900 font-semibold">
          {startTime} - {endTime}
        </div>
        <div className="text-slate-600 text-sm mt-1">{serviceName}</div>
        <div className="text-slate-500 text-sm">{clientName}</div>
      </div>
      {(onEdit || onCancel) && (
        <div className="flex gap-2">
          {onEdit && (
            <button
              type="button"
              className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={onEdit}
            >
              Editar
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default AppointmentCard


