export function isDateOnly(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function parseDateOnly(dateStr) {
  if (!isDateOnly(dateStr)) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function formatDateOnly(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export function addUtcDays(date, days) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}
