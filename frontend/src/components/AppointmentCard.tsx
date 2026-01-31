type AppointmentCardProps = {
  startTime: string
  endTime: string
  serviceName: string
  clientName: string
}

function AppointmentCard({
  startTime,
  endTime,
  serviceName,
  clientName,
}: AppointmentCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-slate-900 font-semibold">
        {startTime} - {endTime}
      </div>
      <div className="text-slate-600 text-sm mt-1">{serviceName}</div>
      <div className="text-slate-500 text-sm">{clientName}</div>
    </div>
  )
}

export default AppointmentCard


