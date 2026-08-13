import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Pagination from '@/shared/components/ui/Pagination/Pagination.jsx'
import { useAuth } from '../../composables/useAuth.js'
import { useToast } from '../../composables/useToast.jsx'
import { listMealPlans } from '../../services/mealPlans.js'
import { normalizeAvatarUrl } from '../../utils/avatar.js'

export default function MealPlans() {
  const toast = useToast()
  const location = useLocation()
  const { user } = useAuth()
  const selectedPatient = location.state?.patient
  const isNutritionist = user?.professional?.speciality === 'nutritionist'
  const [plans, setPlans] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const stats = meta?.stats || {}

  useEffect(() => {
    let mounted = true

    async function loadPlans() {
      try {
        setLoading(true)
        const { data, meta: pagination } = await listMealPlans({
          page,
          perPage: 10,
          clientUuid: selectedPatient?.uuid,
          search,
          status: statusFilter,
          withMeta: true,
        })
        if (!mounted) return

        setPlans(data)
        setMeta(pagination)
      } catch (error) {
        if (mounted) toast.warning(error.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPlans()

    return () => {
      mounted = false
    }
  }, [page, search, selectedPatient?.uuid, statusFilter, toast])

  useEffect(() => {
    setPage(1)
  }, [search, selectedPatient?.uuid, statusFilter])

  const statCards = useMemo(() => [
    { tone: 'green', icon: <ClipboardIcon />, value: numberOrZero(stats.total), label: 'Planos criados', detail: 'Total de planos' },
    { tone: 'green', icon: <LeafIcon />, value: numberOrZero(stats.active), label: 'Planos ativos', detail: 'Em acompanhamento' },
    { tone: 'orange', icon: <CheckCircleIcon />, value: numberOrZero(stats.finished), label: 'Planos finalizados', detail: 'Ciclos encerrados' },
    { tone: 'purple', icon: <CalendarIcon />, value: formatDate(stats.latest_update), label: 'Última atualização', detail: 'Mais recente' },
  ], [stats.active, stats.finished, stats.latest_update, stats.total])

  return (
    <div className="plans-list-page">
      <header className="plans-hero">
        <span className="plans-hero-icon" aria-hidden="true"><AppleIcon /></span>
        <div>
          <h1>Planos Alimentares</h1>
          <p>{descriptionText({ selectedPatient, isNutritionist })}</p>
        </div>

        {isNutritionist ? (
          <Link className="plans-new-button" to="/dashboard/plans" state={selectedPatient ? { patient: selectedPatient } : null}>
            <PlusIcon />
            Novo Plano
          </Link>
        ) : null}
      </header>

      <section className="plans-stat-grid" aria-label="Resumo dos planos alimentares">
        {statCards.map((card) => (
          <article className="plans-stat-card" key={card.label}>
            <span className={`plans-stat-icon is-${card.tone}`} aria-hidden="true">{card.icon}</span>
            <div>
              <strong>{loading ? '-' : card.value}</strong>
              <p>{card.label}</p>
              <small>{card.detail}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="plans-panel">
        <div className="plans-panel-head">
          <div>
            <span aria-hidden="true"><DocumentIcon /></span>
            <h2>Meus Planos</h2>
          </div>
          <div className="plans-panel-tools">
            <label className="plans-search">
              <SearchIcon />
              <input type="search" placeholder="Buscar plano..." aria-label="Buscar plano" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <button type="button" className={filtersOpen || statusFilter ? 'is-active' : ''} aria-label="Filtros" onClick={() => setFiltersOpen((current) => !current)}>
              <FilterIcon /> <span>Filtros</span>
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="plans-filter-bar">
            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Todos</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="finished">Finalizado</option>
              </select>
            </label>
            <button type="button" onClick={() => { setSearch(''); setStatusFilter('') }}>
              Limpar filtros
            </button>
          </div>
        ) : null}

        <div className="plans-table-wrap">
          <table className="plans-table">
            <thead>
              <tr>
                <th>Plano</th>
                <th>{isNutritionist ? 'Paciente' : 'Nutricionista'}</th>
                <th>Início</th>
                <th>Duração</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="plans-empty">Carregando planos...</td></tr>
              ) : plans.length ? (
                plans.map((plan) => (
                  <tr key={plan.uuid}>
                    <td><PlanTitle plan={plan} /></td>
                    <td><PersonCell person={isNutritionist ? plan.client : plan.nutritionist} linkTo={isNutritionist ? clientProfilePath(plan.client) : professionalProfilePath(plan.nutritionist)} /></td>
                    <td><IconText icon={<CalendarIcon />} primary={formatDate(plan.start_date)} secondary={relativeDate(plan.start_date)} /></td>
                    <td><IconText icon={<ClockIcon />} primary={durationText(plan)} /></td>
                    <td><StatusBadge status={plan.status} /></td>
                    <td>
                      <Link className="plans-detail-link" to={`/dashboard/plans/${plan.uuid}`}>Ver detalhes</Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="plans-empty">Nenhum plano alimentar encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="plans-mobile-list">
          {loading ? (
            <div className="plans-empty">Carregando planos...</div>
          ) : plans.length ? (
            plans.map((plan) => (
              <article className="plans-mobile-card" key={plan.uuid}>
                <div className="plans-mobile-card-head">
                  <span className="plans-plan-icon" aria-hidden="true"><AppleIcon /></span>
                  <div>
                    <h3>{plan.title}</h3>
                    <PersonCell person={isNutritionist ? plan.client : plan.nutritionist} linkTo={isNutritionist ? clientProfilePath(plan.client) : professionalProfilePath(plan.nutritionist)} compact />
                  </div>
                </div>
                <IconText icon={<CalendarIcon />} primary={formatDate(plan.start_date)} secondary="Início" />
                <IconText icon={<ClockIcon />} primary={durationText(plan)} secondary="Duração" />
                <StatusBadge status={plan.status} />
                <Link className="plans-mobile-detail" to={`/dashboard/plans/${plan.uuid}`}>
                  Ver detalhes
                  <ArrowRightIcon />
                </Link>
              </article>
            ))
          ) : (
            <div className="plans-empty">Nenhum plano alimentar encontrado.</div>
          )}
        </div>

        <Pagination meta={meta} onPageChange={setPage} />
      </section>
    </div>
  )
}

function PlanTitle({ plan }) {
  return (
    <div className="plans-plan-title">
      <span className="plans-plan-icon" aria-hidden="true"><AppleIcon /></span>
      <div>
        <strong>{plan.title}</strong>
        <small><ClockIcon /> {durationText(plan)}</small>
      </div>
    </div>
  )
}

function PersonCell({ person, linkTo = '', compact = false }) {
  const name = person?.name || '-'
  const [avatarFailed, setAvatarFailed] = useState(false)
  const avatar = normalizeAvatarUrl(person?.avatar)
  const content = (
    <>
      <span aria-hidden="true">{avatar && !avatarFailed ? <img src={avatar} alt="" onError={() => setAvatarFailed(true)} /> : initials(name)}</span>
      <strong>{name}</strong>
    </>
  )

  if (linkTo) {
    return <Link className={`plans-person is-link ${compact ? 'is-compact' : ''}`} to={linkTo}>{content}<ChevronRightIcon /></Link>
  }

  return <div className={`plans-person ${compact ? 'is-compact' : ''}`}>{content}</div>
}

function IconText({ icon, primary, secondary }) {
  return (
    <div className="plans-icon-text">
      <span aria-hidden="true">{icon}</span>
      <div>
        <strong>{primary}</strong>
        {secondary ? <small>{secondary}</small> : null}
      </div>
    </div>
  )
}

function StatusBadge({ status, compact = false }) {
  return (
    <span className={`plans-status is-${status || 'inactive'} ${compact ? 'is-compact' : ''}`}>
      <i aria-hidden="true" />
      {statusLabel(status)}
    </span>
  )
}

function statusLabel(status) {
  return { active: 'Ativo', inactive: 'Inativo', finished: 'Finalizado' }[status] || status || '-'
}

function descriptionText({ selectedPatient, isNutritionist }) {
  if (selectedPatient?.name) return `Planos de ${selectedPatient.name}`
  if (isNutritionist) return 'Todos os planos alimentares criados por você'
  return 'Todos os planos alimentares feitos para você'
}

function formatDate(value) {
  if (!value) return '-'
  const [year, month, day] = String(value).slice(0, 10).split('-')
  if (year && month && day) return `${day}/${month}/${year}`
  return '-'
}

function relativeDate(value) {
  if (!value) return ''
  const date = parseLocalDate(value)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Math.max(0, Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000))
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'há 1 dia'
  return `há ${diff} dias`
}

function durationText(plan) {
  const start = parseLocalDate(plan.start_date)
  const end = parseLocalDate(plan.end_date)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Sem término'
  const days = Math.max(1, Math.round((end - start) / 86400000))
  if (days < 7) return `${days} ${days === 1 ? 'dia' : 'dias'}`
  const weeks = Math.round(days / 7)
  return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
}

function parseLocalDate(value) {
  const [year, month, day] = String(value || '').slice(0, 10).split('-').map(Number)
  if (year && month && day) return new Date(year, month - 1, day)
  return new Date(value)
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function numberOrZero(value) {
  return Number(value || 0)
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'PP'
}

function professionalProfilePath(professional) {
  return professional?.uuid ? `/dashboard/professionals/${professional.uuid}` : ''
}

function clientProfilePath(client) {
  return client?.uuid ? `/dashboard/clients/${client.uuid}` : ''
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function LeafIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14ZM5 19c0-5 3-9 8-11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 7c1.4-2.1 3.2-2.9 5.4-2.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M12 7c-1.5-2.3-3.4-2.9-5.5-1.8C4.2 6.4 3.4 9.5 4.3 13c1.2 4.6 4.1 7.3 6.4 6.2.8-.4 1.8-.4 2.6 0 2.3 1.1 5.2-1.6 6.4-6.2.9-3.5.1-6.6-2.2-7.8-2.1-1.1-4-.5-5.5 1.8Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6.5c.1-1.8.9-3 2.4-3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function ClipboardIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5a3 3 0 0 1 6 0h3v16H6V5h3ZM9 10h6M9 14h6M9 18h3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CheckCircleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 12l2 2 4-5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M5 5h14v16H5V5Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function DocumentIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h10v18H7V3ZM10 8h4M10 12h4M10 16h2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m21 21-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function FilterIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
}

function ArrowRightIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ChevronRightIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
