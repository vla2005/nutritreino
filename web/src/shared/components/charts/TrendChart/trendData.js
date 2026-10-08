export function dateTimestamp(value) {
  if (!value) return NaN
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? `${value}T12:00:00`
    : value
  return new Date(date).getTime()
}

export function normalizeTrendPoints(points = [], valueKey = 'value') {
  return (Array.isArray(points) ? points : [])
    .filter(
      (point) =>
        point[valueKey] !== null &&
        point[valueKey] !== undefined &&
        point[valueKey] !== ''
    )
    .map((point) => ({
      ...point,
      timestamp: dateTimestamp(point.date),
      value: Number(point[valueKey]),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.timestamp) && Number.isFinite(point.value)
    )
    .sort((a, b) => a.timestamp - b.timestamp)
}

export function shortChartDate(value) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

export function chartNumber(value) {
  return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}
