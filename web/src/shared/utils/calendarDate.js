// A measurement date is a calendar day, not an instant at midnight UTC.
// Keep timestamps (e.g. feedback.created_at) subject to the browser timezone.
export function parseCalendarDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const text = String(value)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (match) {
    const [, year, month, day] = match.map(Number)
    const date = new Date(year, month - 1, day)
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatCalendarDate(value) {
  return parseCalendarDate(value)?.toLocaleDateString('pt-BR') || '-'
}

export function localDateInput(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function relativeCalendarDate(value, today = new Date()) {
  const date = parseCalendarDate(value)
  if (!date) return '-'
  return localDateInput(date) === localDateInput(today) ? 'Hoje' : formatCalendarDate(date)
}
