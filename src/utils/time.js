// "09:00:00" → "9:00 AM"
export function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

// "09:00:00" → "09:00" for grouping
export function timeKey(timeStr) {
  return timeStr?.slice(0, 5) ?? ''
}

// "20260612" → "Friday, June 12"
export function formatDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return ''
  const year = Number(dateStr.slice(0, 4))
  const month = Number(dateStr.slice(4, 6)) - 1
  const day = Number(dateStr.slice(6, 8))
  return new Date(year, month, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}
