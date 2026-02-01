const ENABLED_KEY = 'ced_notifications_enabled'
const NOTIFIED_KEY = 'ced_notifications_sent'

type NotifiedMap = Record<string, string>

export function isNotificationsEnabled() {
  return localStorage.getItem(ENABLED_KEY) === 'true'
}

export function setNotificationsEnabled(value: boolean) {
  localStorage.setItem(ENABLED_KEY, value ? 'true' : 'false')
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const result = await Notification.requestPermission()
  return result
}

function loadNotifiedMap(): NotifiedMap {
  const raw = localStorage.getItem(NOTIFIED_KEY)
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw) as NotifiedMap
  } catch (error) {
    return {}
  }
}

function saveNotifiedMap(map: NotifiedMap) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map))
}

export function notifyUpcomingAppointments(
  appointments: Array<{ id: string; startTime?: string | null; serviceName?: string }>
) {
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  const notified = loadNotifiedMap()
  const now = Date.now()
  const twoHours = 2 * 60 * 60 * 1000

  appointments.forEach((appointment) => {
    if (!appointment.startTime) {
      return
    }

    const start = new Date(appointment.startTime).getTime()
    if (Number.isNaN(start)) {
      return
    }

    const diff = start - now
    if (diff <= 0 || diff > twoHours) {
      return
    }

    if (notified[appointment.id]) {
      return
    }

    new Notification('Lembrete de agendamento', {
      body: `Seu horário de ${appointment.serviceName ?? 'serviço'} é em breve.`,
    })

    notified[appointment.id] = new Date().toISOString()
  })

  saveNotifiedMap(notified)
}

