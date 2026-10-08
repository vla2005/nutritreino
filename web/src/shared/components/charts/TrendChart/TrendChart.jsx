import { useId } from 'react'
import { ChartLineUpIcon } from '@phosphor-icons/react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  chartNumber,
  normalizeTrendPoints,
  shortChartDate,
} from './trendData.js'
import './TrendChart.css'

export default function TrendChart({
  points = [],
  valueKey = 'value',
  unit = '%',
  domain = [0, 100],
  title,
  emptyMessage = 'Os próximos check-ins aparecerão aqui.',
  tickValues,
}) {
  const gradientId = useId().replace(/:/g, '')
  const data = normalizeTrendPoints(points, valueKey)
  if (!data.length)
    return (
      <div className="nt-trend-empty" role="status">
        <ChartLineUpIcon size={36} weight="light" aria-hidden="true" />
        <strong>Ainda sem registros neste período</strong>
        <p>{emptyMessage}</p>
      </div>
    )
  const last = data.at(-1)
  const xDomain =
    data.length === 1
      ? [last.timestamp - 86400000, last.timestamp + 86400000]
      : ['dataMin', 'dataMax']
  const ticks =
    data.length <= 5 ? data.map((point) => point.timestamp) : undefined
  return (
    <div className="nt-trend" aria-label={title}>
      <div className="nt-trend-plot">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={data}
            margin={{ top: 28, right: 24, bottom: 4, left: 0 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#288562" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#288562" stopOpacity={0.015} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e7eeea" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={xDomain}
              ticks={ticks}
              tickCount={5}
              minTickGap={28}
              tickFormatter={shortChartDate}
              axisLine={{ stroke: '#dbe5df' }}
              tickLine={false}
              tick={{ fill: '#687a71', fontSize: 12 }}
              tickMargin={12}
              height={38}
            />
            <YAxis
              domain={domain}
              ticks={tickValues}
              tickCount={5}
              tickFormatter={(value) =>
                `${chartNumber(value)}${unit === '%' ? '%' : ''}`
              }
              axisLine={false}
              tickLine={false}
              width={unit === '%' ? 46 : 48}
              tick={{ fill: '#687a71', fontSize: 12 }}
              tickMargin={8}
            />
            <Tooltip
              content={<ChartTooltip unit={unit} />}
              cursor={{ stroke: '#a8cbb9', strokeDasharray: '4 4' }}
            />
            <Area
              type="linear"
              dataKey="value"
              name={title}
              baseValue="dataMin"
              stroke="#288562"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={{
                r: data.length <= 12 ? 4.5 : 2,
                stroke: '#fff',
                strokeWidth: 2,
                fill: '#288562',
              }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3 }}
              isAnimationActive={false}
            >
              {data.length <= 7 ? (
                <LabelList
                  dataKey="value"
                  position="top"
                  offset={12}
                  formatter={(value) =>
                    `${chartNumber(value)}${unit === '%' ? '%' : ''}`
                  }
                  fill="#20352d"
                  fontSize={12}
                />
              ) : null}
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="nt-trend-caption">
        <span>
          {data.length === 1
            ? 'Primeiro registro. A evolução aparecerá com novos check-ins.'
            : `${data.length} registros no período`}
        </span>
        <span>
          Último registro{' '}
          <strong>
            {shortChartDate(last.timestamp)} · {chartNumber(last.value)}
            {unit === '%' ? '%' : ` ${unit}`}
          </strong>
        </span>
      </div>
      <table className="nt-sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Data</th>
            <th>Valor ({unit})</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point, index) => (
            <tr key={`${point.timestamp}-${index}`}>
              <td>{shortChartDate(point.timestamp)}</td>
              <td>{chartNumber(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ChartTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="nt-chart-tooltip">
      <span>{shortChartDate(point.timestamp)}</span>
      <strong>
        {chartNumber(point.value)}
        {unit === '%' ? '%' : ` ${unit}`}
      </strong>
    </div>
  )
}
