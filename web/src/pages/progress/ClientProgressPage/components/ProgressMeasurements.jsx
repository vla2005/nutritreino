export default function ProgressMeasurements({ measurements, items }) {
  const values = measurements || items.map((item) => ({ type: item.key }))

  return (
    <div className="progress-measure-list">
      {values.map((item) => <MeasurementRow key={item.type} item={item} items={items} />)}
    </div>
  )
}

function MeasurementRow({ item, items }) {
  const meta = items.find((entry) => entry.key === item.type) || items[0]
  const delta = item.delta === null || item.delta === undefined ? '- 0 cm' : `${Number(item.delta) > 0 ? '+' : ''}${formatNumber(item.delta)} cm`

  return (
    <div className="progress-measure-row">
      <span aria-hidden="true">{meta.icon}</span>
      <strong>{meta.label}</strong>
      <b>{item.value ? `${formatNumber(item.value)} cm` : '-'}</b>
      <small className={Number(item.delta || 0) > 0 ? 'is-up' : 'is-down'}>{delta}</small>
    </div>
  )
}

function formatNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '-'
}
