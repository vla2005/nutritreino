import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Pagination from '@/shared/components/ui/Pagination/Pagination.jsx'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.jsx'
import { listWorkoutPrograms } from '@/services/workoutPrograms.js'
import { normalizeAvatarUrl } from '@/utils/avatar.js'
import './WorkoutProgramsPage.css'

export default function WorkoutProgramsPage() {
  const toast = useToast()
  const location = useLocation()
  const { user } = useAuth()
  const selectedPatient = location.state?.patient
  const isTrainer = user?.professional?.speciality === 'trainer'
  const [programs, setPrograms] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [goalFilter, setGoalFilter] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const stats = meta?.stats || {}
  const goals = meta?.filters?.goals || []

  useEffect(() => {
    let mounted = true

    async function loadPrograms() {
      try {
        setLoading(true)
        const { data, meta: pagination } = await listWorkoutPrograms({
          page,
          perPage: 10,
          clientUuid: selectedPatient?.uuid,
          search,
          status: statusFilter,
          goal: goalFilter,
          withMeta: true,
        })
        if (!mounted) return

        setPrograms(data)
        setMeta(pagination)
      } catch (error) {
        if (mounted) toast.warning(error.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPrograms()

    return () => {
      mounted = false
    }
  }, [goalFilter, page, search, selectedPatient?.uuid, statusFilter, toast])

  const statCards = useMemo(() => [
    {
      tone: 'green',
      icon: <UsersIcon />,
      value: numberOrZero(stats.total),
      label: 'Treinos criados',
      detail: 'Total de programas',
    },
    {
      tone: 'green',
      icon: <TrendIcon />,
      value: numberOrZero(stats.active),
      label: 'Treinos ativos',
      detail: 'Programas em andamento',
    },
    {
      tone: 'purple',
      icon: <CalendarIcon />,
      value: formatDate(stats.latest_update),
      label: 'Última atualização',
      detail: 'Mais recente',
    },
    {
      tone: 'orange',
      icon: <TargetIcon />,
      value: `${numberOrZero(stats.goal_completion_percent)}%`,
      label: 'Objetivos definidos',
      detail: 'Focados em resultados',
    },
  ], [stats.active, stats.goal_completion_percent, stats.latest_update, stats.total])

  return (
    <div className="workouts-list-page">
      <header className="workouts-hero">
        <span className="workouts-hero-icon" aria-hidden="true"><DumbbellIcon /></span>
        <div>
          <h1>Treinos</h1>
          <p>{descriptionText({ selectedPatient, isTrainer })}</p>
        </div>

        {isTrainer ? (
          <Link className="workouts-new-button" to="/dashboard/workouts/new" state={selectedPatient ? { patient: selectedPatient } : null}>
            <PlusIcon />
            Novo Treino
          </Link>
        ) : null}
      </header>

      <section className="workouts-stat-grid" aria-label="Resumo dos treinos">
        {statCards.map((card) => (
          <article className="workouts-stat-card" key={card.label}>
            <span className={`workouts-stat-icon is-${card.tone}`} aria-hidden="true">{card.icon}</span>
            <div>
              <strong>{loading ? '-' : card.value}</strong>
              <p>{card.label}</p>
              <small>{card.detail}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="workouts-panel">
        <div className="workouts-panel-head">
          <div>
            <span aria-hidden="true"><DocumentIcon /></span>
            <h2>Meus Treinos</h2>
          </div>
          <div className="workouts-panel-tools">
            <label className="workouts-search">
              <SearchIcon />
              <input type="search" placeholder="Buscar treino..." aria-label="Buscar treino" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
            </label>
            <button type="button" className={filtersOpen || statusFilter || goalFilter ? 'is-active' : ''} aria-label="Filtros" onClick={() => setFiltersOpen((current) => !current)}>
              <FilterIcon /> <span>Filtros</span>
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="workouts-filter-bar">
            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}>
                <option value="">Todos</option>
                <option value="active">Ativo</option>
                <option value="draft">Rascunho</option>
                <option value="archived">Arquivado</option>
              </select>
            </label>
            <label>
              <span>Objetivo</span>
              <select value={goalFilter} onChange={(event) => { setGoalFilter(event.target.value); setPage(1) }}>
                <option value="">Todos</option>
                {goals.map((goal) => <option value={goal} key={goal}>{goal}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => { setSearch(''); setStatusFilter(''); setGoalFilter(''); setPage(1) }}>
              Limpar filtros
            </button>
          </div>
        ) : null}

        <div className="workouts-table-wrap">
          <table className="workouts-table">
            <thead>
              <tr>
                <th>Programa</th>
                <th>{isTrainer ? 'Aluno' : 'Treinador'}</th>
                <th>Início</th>
                <th>Objetivo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="workouts-empty">Carregando treinos...</td>
                </tr>
              ) : programs.length ? (
                programs.map((program) => (
                  <tr key={program.uuid}>
                    <td>
                      <ProgramTitle program={program} />
                    </td>
                    <td>
                      <PersonCell person={isTrainer ? program.client : program.trainer} linkTo={isTrainer ? clientProfilePath(program.client) : professionalProfilePath(program.trainer)} />
                    </td>
                    <td>
                      <IconText icon={<CalendarSmallIcon />} primary={formatDate(program.start_date)} secondary={relativeDate(program.start_date)} />
                    </td>
                    <td>
                      <IconText icon={<TargetSmallIcon />} primary={program.goal || '-'} />
                    </td>
                    <td>
                      <StatusBadge status={program.status} />
                    </td>
                    <td>
                      <div className="workouts-actions">
                        <Link className="workouts-detail-link" to={`/dashboard/workouts/${program.uuid}`}>
                          Ver detalhes
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="workouts-empty">Nenhum treino encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="workouts-mobile-list">
          {loading ? (
            <div className="workouts-empty">Carregando treinos...</div>
          ) : programs.length ? (
            programs.map((program) => (
              <article className="workouts-mobile-card" key={program.uuid}>
                <div className="workouts-mobile-card-head">
                  <span className="workouts-program-icon" aria-hidden="true"><DumbbellIcon /></span>
                  <div>
                    <h3>{program.title}</h3>
                    <PersonCell person={isTrainer ? program.client : program.trainer} linkTo={isTrainer ? clientProfilePath(program.client) : professionalProfilePath(program.trainer)} compact />
                  </div>
                </div>
                <IconText icon={<CalendarSmallIcon />} primary={formatDate(program.start_date)} secondary="Início" />
                <IconText icon={<TargetSmallIcon />} primary={program.goal || '-'} secondary="Objetivo" />
                <IconText icon={<ClockIcon />} primary={durationText(program)} secondary="Duração" />
                <StatusBadge status={program.status} />
                <Link className="workouts-mobile-detail" to={`/dashboard/workouts/${program.uuid}`}>
                  Ver detalhes
                  <ArrowRightIcon />
                </Link>
              </article>
            ))
          ) : (
            <div className="workouts-empty">Nenhum treino encontrado.</div>
          )}
        </div>

        <Pagination meta={meta} onPageChange={setPage} />
      </section>
    </div>
  )
}

function ProgramTitle({ program }) {
  return (
    <div className="workouts-program-title">
      <span className="workouts-program-icon" aria-hidden="true"><DumbbellIcon /></span>
      <div>
        <strong>{program.title}</strong>
        <StatusBadge status={program.status} compact />
        <small><ClockIcon /> {durationText(program)}</small>
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
    return <Link className={`workouts-person is-link ${compact ? 'is-compact' : ''}`} to={linkTo}>{content}<ChevronRightIcon /></Link>
  }

  return <div className={`workouts-person ${compact ? 'is-compact' : ''}`}>{content}</div>
}

function IconText({ icon, primary, secondary }) {
  return (
    <div className="workouts-icon-text">
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
    <span className={`workouts-status is-${status || 'draft'} ${compact ? 'is-compact' : ''}`}>
      <i aria-hidden="true" />
      {statusLabel(status)}
    </span>
  )
}

function statusLabel(status) {
  return {
    active: 'Ativo',
    draft: 'Rascunho',
    archived: 'Arquivado',
  }[status] || status || '-'
}

function descriptionText({ selectedPatient, isTrainer }) {
  if (selectedPatient?.name) return `Treinos de ${selectedPatient.name}`
  if (isTrainer) return 'Todos os programas de treino criados por você'
  return 'Todos os programas de treino feitos para você'
}

function formatDate(value) {
  if (!value) return '-'
  const [year, month, day] = String(value).slice(0, 10).split('-')
  if (year && month && day) return `${day}/${month}/${year}`
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR')
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

function durationText(program) {
  const start = parseLocalDate(program.start_date)
  const end = parseLocalDate(program.end_date)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '8 semanas'
  const weeks = Math.max(1, Math.round((end - start) / 604800000))
  return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseLocalDate(value) {
  const [year, month, day] = String(value || '').split('T')[0].split('-').map(Number)
  if (year && month && day) return new Date(year, month - 1, day)
  return new Date(value)
}

function numberOrZero(value) {
  return Number(value || 0)
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'TT'
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

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function TrendIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 17 10 11l4 4 6-8M14 7h6v6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function TargetIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
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

function CalendarSmallIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M5 5h14v16H5V5Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function TargetSmallIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ArrowRightIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ChevronRightIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
