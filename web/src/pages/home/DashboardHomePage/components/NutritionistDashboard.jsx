import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PatientFormModal from '@/components/patients/PatientFormModal.jsx'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.jsx'
import { clientErrorToFormErrors, inviteClient, validateClientPayload } from '@/services/clients.js'
import { getNutritionistDashboard } from '@/services/dashboard.js'
import { normalizeAvatarUrl } from '@/utils/avatar.js'
import { useProfessionalDashboard } from '../hooks/useProfessionalDashboard.js'
import { buildDonutSegments } from '../utils/dashboardCharts.js'

const emptyForm = () => ({ name: '', email: '', phone: '', cpf: '', gender: '', birth_date: '', height: '', weight: '' })

export default function NutritionistDashboard() {
  const { user, fullName } = useAuth()
  const toast = useToast()
  const { dashboard, loading, error, refresh } = useProfessionalDashboard(getNutritionistDashboard)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const data = dashboard
  const firstName = professionalFirstName(data?.greeting?.name || fullName || user?.name)
  const chartPoints = useMemo(() => normalizeHistory(data?.adherence_history), [data?.adherence_history])

  function openPatientModal() {
    setForm(emptyForm())
    setFormErrors({})
    setModalOpen(true)
  }

  function updateForm(nextForm) {
    setForm(nextForm)
    setFormErrors((current) => {
      const next = { ...current }
      Object.keys(nextForm).forEach((key) => {
        if (nextForm[key] !== form[key]) delete next[key]
      })
      return next
    })
  }

  async function savePatient() {
    const errors = validateClientPayload(form)
    setFormErrors(errors)

    if (Object.keys(errors).length) {
      toast.warning('Revise os campos destacados.')
      return
    }

    try {
      setSaving(true)
      await inviteClient(form)
      setModalOpen(false)
      toast.success('Convite enviado com sucesso.')
      await refresh({ notifyError: false })
    } catch (error) {
      const errors = clientErrorToFormErrors(error)
      setFormErrors(errors)
      toast.warning(Object.values(errors)[0] || error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!data && loading) {
    return <NutritionistDashboardSkeleton firstName={firstName} />
  }

  if (!data) {
    return (
      <div className="nutritionist-dashboard-page">
        <header className="nd-header">
          <div>
            <h1>Olá, {firstName}!</h1>
            <p>Aqui está o resumo da sua prática clínica.</p>
          </div>
          <div className="nd-header-actions">
            <button type="button" className="nd-new-button" onClick={openPatientModal}><PlusIcon /> Novo registro <ChevronDownIcon /></button>
          </div>
        </header>
        <div className="nd-card nd-dashboard-error">
          {error || 'Não foi possível carregar o dashboard agora.'}
        </div>
        <PatientFormModal open={modalOpen} form={form} errors={formErrors} loading={saving} onClose={() => setModalOpen(false)} onSave={savePatient} onChange={updateForm} />
      </div>
    )
  }

  return (
    <div className="nutritionist-dashboard-page">
      <header className="nd-header">
        <div>
          <h1>Olá, {firstName}! <span aria-hidden="true">👋</span></h1>
          <p>Aqui está o resumo da sua prática clínica.</p>
        </div>
        <div className="nd-header-actions">
          <button type="button" className="nd-new-button" onClick={openPatientModal}><PlusIcon /> Novo registro <ChevronDownIcon /></button>
        </div>
      </header>

      <section className="nd-stat-grid" aria-label="Indicadores principais">
        <StatCard tone="green" icon={<UsersIcon />} title="Clientes ativos" value={data.stats.active_clients.value} detail={data.stats.active_clients.detail} />
        <StatCard tone="purple" icon={<ClipboardIcon />} title="Planos alimentares" value={data.stats.meal_plans.value} detail={data.stats.meal_plans.detail} />
        <StatCard tone="blue" icon={<CalendarIcon />} title="Check-ins esta semana" value={data.stats.weekly_checkins.value} detail={data.stats.weekly_checkins.detail} />
        <StatCard tone="green" icon={<TargetIcon />} title="Metas em andamento" value={data.stats.goals.value} detail={data.stats.goals.detail} />
        <StatCard tone="orange" icon={<UtensilsIcon />} title="Adesão média à dieta" value={`${data.stats.diet_adherence.value}%`} detail={data.stats.diet_adherence.detail} />
      </section>

      <section className="nd-main-grid">
        <article className="nd-card nd-adherence-card">
          <CardTitle title="Adesão dos clientes à dieta" />
          <div className="nd-donut-layout">
            <Donut average={data.adherence.average} items={data.adherence.items} />
            <div className="nd-legend-list">
              {data.adherence.items.map((item) => <LegendRow key={item.label} item={item} />)}
            </div>
          </div>
        </article>

        <article className="nd-card">
          <CardTitle title="Principais objetivos dos clientes" link="Ver todos" />
          <div className="nd-objective-list">
            {data.goals.map((item, index) => <ObjectiveRow key={item.label} item={item} index={index} />)}
          </div>
        </article>

        <article className="nd-card">
          <CardTitle title="Tipos de plano mais utilizados" link="Ver todos" />
          <div className="nd-plan-types">
            {data.plan_types.map((item) => <PlanTypeRow key={item.label} item={item} />)}
          </div>
        </article>
      </section>

      <section className="nd-secondary-grid">
        <article className="nd-card">
          <h2>Planos por status</h2>
          <div className="nd-status-list">
            {data.plan_status.map((item) => <StatusRow key={item.label} item={item} />)}
          </div>
        </article>

        <article className="nd-card">
          <CardTitle title="Últimos check-ins" link="Ver todos" />
          <CheckInList items={data.latest_checkins} />
        </article>

        <article className="nd-card">
          <CardTitle title="Clientes que precisam de atenção" link="Ver todos" linkTo="/patients" />
          <AttentionList items={data.attention_clients} />
        </article>
      </section>

      <section className="nd-bottom-grid">
        <article className="nd-card nd-chart-card">
          <CardTitle title="Evolução da adesão à dieta" />
          <AdherenceChart points={chartPoints} />
        </article>

        <article className="nd-card">
          <h2>Resumo geral</h2>
          <div className="nd-summary-list">
            {data.summary.map((item, index) => <SummaryRow key={item.label} item={item} index={index} />)}
          </div>
        </article>
      </section>

      {loading ? <div className="nd-loading">Atualizando dashboard...</div> : null}
      <PatientFormModal open={modalOpen} form={form} errors={formErrors} loading={saving} onClose={() => setModalOpen(false)} onSave={savePatient} onChange={updateForm} />
    </div>
  )
}

function NutritionistDashboardSkeleton({ firstName }) {
  return (
    <div className="nutritionist-dashboard-page" aria-busy="true">
      <header className="nd-header">
        <div>
          <h1>Olá, {firstName}!</h1>
          <p>Aqui está o resumo da sua prática clínica.</p>
        </div>
        <div className="nd-header-actions">
          <span className="nd-new-button nd-skeleton-button"><PlusIcon /> Novo registro <ChevronDownIcon /></span>
        </div>
      </header>

      <section className="nd-stat-grid" aria-label="Carregando indicadores principais">
        {Array.from({ length: 5 }).map((_, index) => <SkeletonStatCard key={index} />)}
      </section>

      <section className="nd-main-grid">
        <SkeletonPanel variant="donut" />
        <SkeletonPanel variant="list" rows={4} />
        <SkeletonPanel variant="progress" rows={4} />
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

function CardTitle({ title, link, linkTo = '/dashboard/meal-plans', action }) {
  return (
    <header className="nd-card-title">
      <h2>{title}</h2>
      {link ? <Link to={linkTo}>{link}</Link> : null}
      {action ? <button type="button">{action}<ChevronDownIcon /></button> : null}
    </header>
  )
}

function Donut({ average, items }) {
  const colors = { green: '#08a966', blue: '#64748b', orange: '#f5af17', red: '#ef5b5b' }
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
  const icons = [<ArrowDownIcon />, <ArmIcon />, <BodyIcon />, <FlaskIcon />]
  return (
    <div className="nd-objective-row">
      <span>{icons[index] || <TargetIcon />}</span>
      <strong>{item.label}</strong>
      <b>{item.value}</b>
      <small>({item.percent}%)</small>
    </div>
  )
}

function PlanTypeRow({ item }) {
  return (
    <div className="nd-plan-type-row">
      <div><span className={`is-${item.tone}`}><FileIcon /></span><strong>{item.label}</strong><b>{item.percent}%</b></div>
      <i><em className={`is-${item.tone}`} style={{ width: `${item.percent}%` }} /></i>
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
            <div><strong>{item.client?.name || 'Cliente'}</strong><small>{item.label}</small></div>
            <b>Check-in</b>
          </div>
        )
      })}
    </div>
  )
}

function AttentionList({ items }) {
  if (!items?.length) return <div className="nd-empty">Nenhum cliente precisa de atenção agora.</div>

  return (
    <div className="nd-attention-list">
      {items.map((item) => {
        const avatar = normalizeAvatarUrl(item.client?.avatar)
        return (
          <div className="nd-attention-row" key={`${item.client?.uuid}-${item.reason}`}>
            <span>{avatar ? <img src={avatar} alt="" /> : initials(item.client?.name)}</span>
            <div>
              <strong>{item.client?.name || 'Cliente'}</strong>
              <small>{item.reason}</small>
              <p>{item.detail}</p>
            </div>
            <Link to={item.client?.uuid ? `/dashboard/clients/${item.client.uuid}` : '/patients'}>{item.action === 'plan' ? 'Revisar' : 'Acompanhar'}</Link>
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
        <div className="nd-empty">Nenhum check-in com adesao a dieta nos ultimos 30 dias.</div>
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
  const icons = [<UsersIcon />, <ClipboardIcon />, <CalendarIcon />, <UtensilsIcon />]
  return (
    <div className="nd-summary-row">
      <span>{icons[index] || <CheckIcon />}</span>
      <strong>{item.label}</strong>
      <b>{item.trend}</b>
    </div>
  )
}

function normalizeHistory(points = []) {
  return Array.isArray(points) ? points : []
}

function _fallbackDashboard(name = 'Vanessa Almeida') {
  return {
    greeting: { name, date: '2026-05-18' },
    stats: {
      active_clients: { value: 32, detail: '+ 8 este mês' },
      meal_plans: { value: 48, detail: '+ 12 este mês' },
      weekly_checkins: { value: 26, detail: '76% dos clientes' },
      goals: { value: 24, detail: '75% dos clientes' },
      diet_adherence: { value: 78, detail: '+ 6% este mês' },
    },
    adherence: { average: 78, items: [
      { label: 'Excelente (>= 90%)', value: 14, percent: 44, tone: 'green' },
      { label: 'Boa (70% - 89%)', value: 10, percent: 31, tone: 'blue' },
      { label: 'Regular (50% - 69%)', value: 6, percent: 19, tone: 'orange' },
      { label: 'Baixa (< 50%)', value: 2, percent: 6, tone: 'red' },
    ] },
    goals: [
      { label: 'Emagrecimento', value: 16, percent: 50 },
      { label: 'Ganhar massa', value: 8, percent: 25 },
      { label: 'Recomposição corporal', value: 6, percent: 19 },
      { label: 'Manutenção', value: 2, percent: 6 },
    ],
    plan_types: [
      { label: 'Hipocalórico', percent: 42, tone: 'green' },
      { label: 'Equilíbrio nutricional', percent: 28, tone: 'purple' },
      { label: 'Hipercalórico', percent: 18, tone: 'orange' },
      { label: 'Low carb', percent: 12, tone: 'blue' },
    ],
    plan_status: [
      { label: 'Em andamento', value: 38, tone: 'green' },
      { label: 'Pausados', value: 4, tone: 'orange' },
      { label: 'Concluídos', value: 12, tone: 'green' },
    ],
    latest_checkins: [],
    attention_clients: [],
    adherence_history: [78, 75, 70, 83, 76, 72, 80, 74, 81, 68].map((value, index) => ({ date: `2026-05-${String(index + 9).padStart(2, '0')}`, value })),
    summary: [
      { label: 'Clientes ativos', trend: '+ 8 este mês' },
      { label: 'Planos alimentares ativos', trend: '+ 12 este mês' },
      { label: 'Check-ins este mês', trend: '+ 15% este mês' },
      { label: 'Adesão média à dieta', trend: '+ 6% este mês' },
    ],
  }
}

function professionalFirstName(name = '') {
  return String(name || 'Vanessa').trim().split(/\s+/)[0] || 'Vanessa'
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'CL'
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
function UtensilsIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v8M4 3v8a3 3 0 0 0 6 0V3M17 3v18M17 3c2 2 3 4 3 7h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ArrowDownIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v14M7 13l5 5 5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ArmIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 15c2 3 7 3 8-1 .7-2.5-.8-4-3-4h-1V6M7 13l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function BodyIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 21c1-5 3-8 6-8s5 3 6 8M8 14l-3 3M16 14l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function FlaskIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3M8 16h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function TrendIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 16.5 9 11l4 3 7-8M15 6h5v5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function FileIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h7l5 5v13H7V3ZM14 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg> }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
