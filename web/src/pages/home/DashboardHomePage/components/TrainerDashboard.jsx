import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/composables/useAuth.js'
import { getTrainerDashboard } from '@/services/dashboard.js'
import { normalizeAvatarUrl } from '@/utils/avatar.js'
import { useProfessionalDashboard } from '../hooks/useProfessionalDashboard.js'
import { buildDonutSegments } from '../utils/dashboardCharts.js'

export default function TrainerDashboard() {
  const { user, fullName } = useAuth()
  const { dashboard, loading, error } = useProfessionalDashboard(getTrainerDashboard)

  const data = dashboard
  const firstName = firstNameFrom(data?.greeting?.name || fullName || user?.name)
  const chartPoints = useMemo(() => normalizeHistory(data?.adherence_history), [data?.adherence_history])

  if (!data && loading) {
    return <TrainerDashboardSkeleton firstName={firstName} />
  }

  if (!data) {
    return (
      <div className="nutritionist-dashboard-page trainer-dashboard-page">
        <header className="nd-header">
          <div>
            <h1>Olá, {firstName}!</h1>
            <p>Aqui está o resumo dos seus alunos e programas de treino.</p>
          </div>
          <div className="nd-header-actions">
            <Link className="nd-new-button" to="/dashboard/workouts/new"><PlusIcon /> Novo treino</Link>
          </div>
        </header>
        <div className="nd-card nd-dashboard-error">
          {error || 'Não foi possível carregar o dashboard agora.'}
        </div>
      </div>
    )
  }

  return (
    <div className="nutritionist-dashboard-page trainer-dashboard-page">
      <header className="nd-header">
        <div>
          <h1>Olá, {firstName}! <span aria-hidden="true">👋</span></h1>
          <p>Aqui está o resumo dos seus alunos e programas de treino.</p>
        </div>
        <div className="nd-header-actions">
          <Link className="nd-new-button" to="/dashboard/workouts/new"><PlusIcon /> Novo treino</Link>
        </div>
      </header>

      <section className="nd-stat-grid" aria-label="Indicadores principais">
        <StatCard tone="green" icon={<UsersIcon />} title="Alunos ativos" value={data.stats.active_clients.value} detail={data.stats.active_clients.detail} />
        <StatCard tone="green" icon={<ClipboardIcon />} title="Programas de treino criados" value={data.stats.workout_programs.value} detail={data.stats.workout_programs.detail} />
        <StatCard tone="blue" icon={<DumbbellIcon />} title="Treinos ativos" value={data.stats.active_workouts.value} detail={data.stats.active_workouts.detail} />
        <StatCard tone="purple" icon={<CalendarIcon />} title="Check-ins esta semana" value={data.stats.weekly_checkins.value} detail={data.stats.weekly_checkins.detail} />
      </section>

      <section className="nd-main-grid">
        <article className="nd-card nd-adherence-card">
          <CardTitle title="1. Adesão dos alunos aos treinos" />
          <div className="nd-donut-layout">
            <Donut average={data.adherence.average} items={data.adherence.items} />
            <div className="nd-legend-list">
              {data.adherence.items.map((item) => <LegendRow key={item.label} item={item} />)}
            </div>
          </div>
        </article>

        <article className="nd-card">
          <CardTitle title="2. Principais objetivos dos alunos" />
          <div className="nd-objective-list">
            {data.goals.map((item, index) => <ObjectiveRow key={item.label} item={item} index={index} />)}
          </div>
        </article>
      </section>

      <section className="nd-secondary-grid">
        <article className="nd-card">
          <h2>3. Programas por status</h2>
          <div className="nd-status-list">
            {data.program_status.map((item) => <StatusRow key={item.label} item={item} />)}
          </div>
        </article>

        <article className="nd-card">
          <CardTitle title="4. Últimos check-ins" link="Ver todos" linkTo="/patients" />
          <CheckInList items={data.latest_checkins} />
        </article>

        <article className="nd-card">
          <CardTitle title="5. Alunos que precisam de atenção" link="Ver todos" linkTo="/patients" />
          <AttentionList items={data.attention_students} />
        </article>
      </section>

      <section className="nd-bottom-grid">
        <article className="nd-card nd-chart-card">
          <CardTitle title="6. Evolução da adesão ao treino" />
          <AdherenceChart points={chartPoints} />
        </article>

        <article className="nd-card">
          <h2>7. Resumo geral</h2>
          <div className="nd-summary-list">
            {data.summary.map((item, index) => <SummaryRow key={item.label} item={item} index={index} />)}
          </div>
        </article>
      </section>

      {loading ? <div className="nd-loading">Atualizando dashboard...</div> : null}
    </div>
  )
}

function TrainerDashboardSkeleton({ firstName }) {
  return (
    <div className="nutritionist-dashboard-page trainer-dashboard-page" aria-busy="true">
      <header className="nd-header">
        <div>
          <h1>Olá, {firstName}!</h1>
          <p>Aqui está o resumo dos seus alunos e programas de treino.</p>
        </div>
        <div className="nd-header-actions">
          <span className="nd-new-button nd-skeleton-button"><PlusIcon /> Novo treino</span>
        </div>
      </header>

      <section className="nd-stat-grid" aria-label="Carregando indicadores principais">
        {Array.from({ length: 4 }).map((_, index) => <SkeletonStatCard key={index} />)}
      </section>

      <section className="nd-main-grid">
        <SkeletonPanel variant="donut" />
        <SkeletonPanel variant="list" rows={4} />
      </section>

      <section className="nd-secondary-grid">
        <SkeletonPanel variant="status" rows={3} />
        <SkeletonPanel variant="people" rows={5} />
        <SkeletonPanel variant="people" rows={5} />
      </section>

      <section className="nd-bottom-grid">
        <SkeletonPanel variant="chart" />
        <SkeletonPanel variant="summary" rows={4} />
      </section>
    </div>
  )
}

function SkeletonStatCard() {
  return (
    <article className="nd-stat-card nd-skeleton-card">
      <span className="nd-skeleton-shape is-icon" />
      <div>
        <span className="nd-skeleton-line is-label" />
        <span className="nd-skeleton-line is-number" />
        <span className="nd-skeleton-line is-detail" />
      </div>
    </article>
  )
}

function SkeletonPanel({ variant, rows = 3 }) {
  return (
    <article className={`nd-card nd-skeleton-panel is-${variant}`}>
      <header className="nd-card-title">
        <span className="nd-skeleton-line is-title" />
        <span className="nd-skeleton-line is-action" />
      </header>
      {variant === 'donut' ? (
        <div className="nd-skeleton-donut-layout">
          <span className="nd-skeleton-shape is-donut" />
          <div className="nd-skeleton-list">
            {Array.from({ length: 4 }).map((_, index) => <span className="nd-skeleton-line" key={index} />)}
          </div>
        </div>
      ) : variant === 'chart' ? (
        <div className="nd-skeleton-chart">
          {Array.from({ length: 5 }).map((_, index) => <span key={index} />)}
        </div>
      ) : (
        <div className="nd-skeleton-list">
          {Array.from({ length: rows }).map((_, index) => (
            <div className="nd-skeleton-row" key={index}>
              <span className="nd-skeleton-shape is-avatar" />
              <span className="nd-skeleton-line" />
              <span className="nd-skeleton-line is-small" />
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function StatCard({ tone, icon, title, value, detail }) {
  return (
    <article className="nd-stat-card">
      <span className={`is-${tone}`} aria-hidden="true">{icon}</span>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  )
}

function CardTitle({ title, link, linkTo = '/dashboard/workouts', action }) {
  return (
    <header className="nd-card-title">
      <h2>{title}</h2>
      {link ? <Link to={linkTo}>{link}</Link> : null}
      {action ? <button type="button">{action}<ChevronDownIcon /></button> : null}
    </header>
  )
}

function Donut({ average, items }) {
  const colors = { green: '#08a966', blue: '#61b86d', orange: '#f5af17', red: '#ef5b5b' }
  const segments = buildDonutSegments(items, colors)

  return (
    <div className="nd-donut" style={{ '--donut': `conic-gradient(${segments || '#e8efec 0 100%'})` }}>
      <div>
        <strong>{average}%</strong>
        <span>adesão média</span>
      </div>
    </div>
  )
}

function LegendRow({ item }) {
  return (
    <div className="nd-legend-row">
      <i className={`is-${item.tone}`} />
      <span>{item.label}</span>
      <strong>{item.value} ({item.percent}%)</strong>
    </div>
  )
}

function ObjectiveRow({ item, index }) {
  const icons = [<ArmIcon />, <ArrowDownIcon />, <DumbbellIcon />, <HeartIcon />]
  return (
    <div className="nd-objective-row">
      <span>{icons[index] || <TargetIcon />}</span>
      <strong>{item.label}</strong>
      <b>{item.value}</b>
      <small>({item.percent}%)</small>
    </div>
  )
}

function StatusRow({ item }) {
  return (
    <div className="nd-status-row">
      <span className={`is-${item.tone}`}><TrendIcon /></span>
      <strong>{item.label}</strong>
      <b>{item.value}</b>
    </div>
  )
}

function CheckInList({ items }) {
  if (!items?.length) return <div className="nd-empty">Nenhum check-in recente.</div>

  return (
    <div className="nd-checkin-list">
      {items.map((item) => {
        const avatar = normalizeAvatarUrl(item.client?.avatar)
        return (
          <div className="nd-checkin-row" key={item.uuid}>
            <span>{avatar ? <img src={avatar} alt="" /> : initials(item.client?.name)}</span>
            <div><strong>{item.client?.name || 'Aluno'}</strong><small>{item.label}</small></div>
            <Link to={item.client?.uuid ? `/dashboard/progress?client_uuid=${item.client.uuid}` : '/patients'}>Ver check-in</Link>
          </div>
        )
      })}
    </div>
  )
}

function AttentionList({ items }) {
  if (!items?.length) return <div className="nd-empty">Nenhum aluno precisa de atenção agora.</div>

  return (
    <div className="nd-attention-list">
      {items.map((item) => {
        const avatar = normalizeAvatarUrl(item.student?.avatar)
        return (
          <div className="nd-attention-row" key={`${item.student?.uuid}-${item.reason}`}>
            <span>{avatar ? <img src={avatar} alt="" /> : initials(item.student?.name)}</span>
            <div>
              <strong>{item.student?.name || 'Aluno'}</strong>
              <small>{item.reason}</small>
              <p>{item.detail}</p>
            </div>
            <Link to={item.student?.uuid ? `/dashboard/clients/${item.student.uuid}` : '/patients'}>Acompanhar</Link>
          </div>
        )
      })}
    </div>
  )
}

function AdherenceChart({ points }) {
  const width = 760
  const height = 190

  if (!points.length) {
    return (
      <div className="nd-line-chart nd-empty-chart">
        <div className="nd-empty">Nenhum check-in com adesao ao treino nos ultimos 30 dias.</div>
      </div>
    )
  }

  const values = points.map((point) => Number(point.value) || 0)
  const minValue = values.length ? Math.min(...values) : 0
  const maxValue = values.length ? Math.max(...values) : 100
  const lowerBound = Math.max(0, Math.floor((minValue - 8) / 5) * 5)
  const upperBound = Math.min(100, Math.ceil((maxValue + 8) / 5) * 5)
  const domainMin = lowerBound === upperBound ? Math.max(0, lowerBound - 10) : lowerBound
  const domainMax = lowerBound === upperBound ? Math.min(100, upperBound + 10) : upperBound
  const domainRange = Math.max(1, domainMax - domainMin)
  const gridLines = [domainMax, Math.round(domainMin + domainRange * 0.75), Math.round(domainMin + domainRange * 0.5), Math.round(domainMin + domainRange * 0.25), domainMin]
  const plot = points.map((item, index) => {
    const x = 32 + (index / Math.max(1, points.length - 1)) * (width - 68)
    const y = 18 + ((domainMax - item.value) / domainRange) * (height - 42)
    return { x, y, item }
  })
  const d = plot.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const last = plot.at(-1)

  return (
    <div className="nd-line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {gridLines.map((line, index) => <g key={`${line}-${index}`}><line x1="32" x2="724" y1={18 + index * 34} y2={18 + index * 34} /><text x="0" y={22 + index * 34}>{line}%</text></g>)}
        <path d={d} />
        {plot.map((point) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" />)}
        {last ? <circle className="is-last" cx={last.x} cy={last.y} r="7" /> : null}
      </svg>
      {last ? <div className="nd-chart-tip" style={{ left: `${(last.x / width) * 100}%`, top: `${(last.y / height) * 100}%` }}><strong>{last.item.value}%</strong><span>{shortDate(last.item.date)}</span></div> : null}
    </div>
  )
}

function SummaryRow({ item, index }) {
  const icons = [<UsersIcon />, <DumbbellIcon />, <CalendarIcon />, <TargetIcon />]
  return (
    <div className="nd-summary-row">
      <span>{icons[index] || <TargetIcon />}</span>
      <strong>{item.label}</strong>
      <b>{item.trend}</b>
    </div>
  )
}

function normalizeHistory(points = []) {
  return Array.isArray(points) ? points : []
}

function _fallbackDashboard(name = 'Gabriel Lima') {
  return {
    greeting: { name, date: '2026-05-18' },
    stats: {
      active_clients: { value: 42, detail: '+ 8 este mês' },
      workout_programs: { value: 36, detail: '+ 6 este mês' },
      active_workouts: { value: 120, detail: '+ 15 este mês' },
      weekly_checkins: { value: 28, detail: '67% dos alunos' },
    },
    adherence: { average: 81, items: [
      { label: 'Excelente', value: 28, percent: 33, tone: 'green' },
      { label: 'Boa', value: 28, percent: 33, tone: 'blue' },
      { label: 'Regular', value: 18, percent: 21, tone: 'orange' },
      { label: 'Baixa', value: 10, percent: 12, tone: 'red' },
    ] },
    goals: [
      { label: 'Hipertrofia', value: 18, percent: 43 },
      { label: 'Emagrecimento', value: 12, percent: 29 },
      { label: 'Força', value: 8, percent: 19 },
      { label: 'Condicionamento físico', value: 4, percent: 9 },
    ],
    program_status: [
      { label: 'Em andamento', value: 86, tone: 'green' },
      { label: 'Pausados', value: 18, tone: 'orange' },
      { label: 'Concluídos', value: 16, tone: 'blue' },
    ],
    latest_checkins: [],
    attention_students: [],
    adherence_history: [76, 74, 80, 69, 83, 72, 81, 76, 78, 70].map((value, index) => ({ date: `2026-05-${String(index + 9).padStart(2, '0')}`, value })),
    summary: [
      { label: 'Alunos ativos', trend: '+ 8 este mês' },
      { label: 'Treinos ativos', trend: '+ 15 este mês' },
      { label: 'Check-ins do mês', trend: '+ 20 este mês' },
      { label: 'Adesão média aos treinos', trend: '+ 5% este mês' },
    ],
  }
}

function firstNameFrom(name = '') {
  return String(name || 'Gabriel').trim().split(/\s+/)[0] || 'Gabriel'
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'AL'
}

function shortDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg> }
function ChevronDownIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function UsersIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 19a4 4 0 0 0-8 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 18a3 3 0 0 0-2.2-2.9M17 6.4a3 3 0 0 1 0 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> }
function CalendarIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M5 5h14v16H5V5Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ClipboardIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 4h6l1 2h3v15H5V6h3l1-2ZM9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function TargetIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 12h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg> }
function DumbbellIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8V16M18 8V16M4 10V14M20 10V14M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function ArrowDownIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v14M7 13l5 5 5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ArmIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 15c2 3 7 3 8-1 .7-2.5-.8-4-3-4h-1V6M7 13l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function HeartIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20s-7-4.4-9-9.2C1.8 8 3.4 5 6.5 5c1.8 0 3.1 1 3.9 2.1C11.2 6 12.5 5 14.3 5c3.1 0 4.7 3 3.5 5.8C16 15.6 12 20 12 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg> }
function TrendIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 16.5 9 11l4 3 7-8M15 6h5v5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
