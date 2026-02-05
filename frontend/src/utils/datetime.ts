function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function toTimeDisplay(value?: string | null) {
  if (!value) return ''

  if (/^\d{2}:\d{2}$/.test(value)) return value

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''

  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`
}

export function toDateDisplay(value?: string | null) {
  if (!value) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''

  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}
