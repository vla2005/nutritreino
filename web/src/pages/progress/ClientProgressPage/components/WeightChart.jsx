export default function WeightChart({ points }) {
  const values = (points || []).filter((item) => Number.isFinite(Number(item.weight)))
  if (!values.length) return <div className="progress-chart is-empty"><span>Nenhum peso registrado.</span></div>

  const weights = values.map((item) => Number(item.weight))
  const padding = values.length === 1 ? 2 : 1
  const min = Math.min(...weights) - padding
  const max = Math.max(...weights) + padding
  const width = 720
  const height = 220
  const plot = values.map((item, index) => ({ x: 38 + (index / Math.max(1, values.length - 1)) * (width - 76), y: 28 + ((max - Number(item.weight)) / Math.max(1, max - min)) * (height - 58), item }))
  const last = plot.at(-1)
  const path = plot.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <div className="progress-chart">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {chartGridLines(min, max).map((line, index) => <g key={line}><line x1="30" y1={32 + index * 36} x2="690" y2={32 + index * 36} /><text x="2" y={37 + index * 36}>{formatNumber(line)}</text></g>)}
        {plot.length > 1 ? <path d={path} /> : null}
        {plot.map((point) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" />)}
        <circle className="is-last" cx={last.x} cy={last.y} r="7" />
      </svg>
      <div className="progress-chart-tooltip" style={{ left: `${Math.min(88, Math.max(12, (last.x / width) * 100))}%`, top: `${Math.min(72, Math.max(12, (last.y / height) * 100))}%` }}>{last.item.source === 'profile' ? 'Peso inicial' : formatDate(last.item.date)}<strong>{formatNumber(last.item.weight)} kg</strong></div>
      <div className="progress-chart-dates">{chartDateLabels(values).map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
    </div>
  )
}

function chartGridLines(min, max) {
  const step = (max - min) / 5
  return Array.from({ length: 6 }, (_, index) => max - step * index)
}

function chartDateLabels(values) {
  if (!values.length) return []
  const indexes = [...new Set([0, Math.floor((values.length - 1) / 3), Math.floor(((values.length - 1) * 2) / 3), values.length - 1])]
  return indexes.map((index) => values[index]?.source === 'profile' ? 'Inicial' : formatShortDate(values[index]?.date))
}

function formatNumber(value) { return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR') }
function formatShortDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) }
