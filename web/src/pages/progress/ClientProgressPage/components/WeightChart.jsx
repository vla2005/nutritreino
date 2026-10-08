import TrendChart from '@/shared/components/charts/TrendChart/TrendChart.jsx'

export default function WeightChart({ points = [] }) {
  const values = points.filter(
    (point) =>
      point.weight !== null &&
      point.weight !== '' &&
      Number.isFinite(Number(point.weight)) &&
      Number(point.weight) > 0
  )
  const weights = values.map((point) => Number(point.weight))
  const domain = values.length
    ? [
        Math.max(0, Math.floor(Math.min(...weights) - 2)),
        Math.ceil(Math.max(...weights) + 2),
      ]
    : [0, 100]
  return (
    <TrendChart
      points={values}
      valueKey="weight"
      unit="kg"
      domain={domain}
      title="Evolução do peso"
      emptyMessage="Registre o primeiro peso para começar a acompanhar sua evolução."
    />
  )
}
