export function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(dateStr, days) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + days)
  return localDateString(date)
}

export function formatDisplayDate(dateStr, options = { weekday: 'long', month: 'short', day: 'numeric' }) {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, options)
}

export function isToday(dateStr) {
  return dateStr === localDateString()
}

export function weekdayLabel(dateStr) {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, { weekday: 'short' })
}
