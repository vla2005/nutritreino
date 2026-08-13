import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PatientFormModal from '@/features/people/components/PatientFormModal/PatientFormModal.jsx'
import Pagination from '@/shared/components/ui/Pagination/Pagination.jsx'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.jsx'
import { clientErrorToFormErrors, inviteClient, listClients, validateClientPayload } from '@/services/clients.js'
import { startConversationWithClient } from '@/services/messages.js'
import { normalizeAvatarUrl } from '@/utils/avatar.js'
import './PatientsPage.css'

const emptyForm = () => ({ name: '', email: '', phone: '', cpf: '', gender: '', birth_date: '', height: '', weight: '' })

export default function PatientsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const isTrainer = user?.professional?.speciality === 'trainer'
  const label = isTrainer ? 'Alunos' : 'Pacientes'
  const singular = isTrainer ? 'aluno' : 'paciente'
  const [patients, setPatients] = useState([])
  const [meta, setMeta] = useState(null)
  const [searchPage, setSearchPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [startingChatUuid, setStartingChatUuid] = useState('')
  const stats = meta?.stats || {}

  const normalizedPatients = useMemo(() => patients.map(normalizePatient), [patients])
  const statCards = [
    { tone: 'green', icon: <UsersIcon />, value: numberOrZero(stats.total), label: `${label} cadastrados`, detail: 'Total vinculado' },
    { tone: 'green', icon: <CheckCircleIcon />, value: numberOrZero(stats.active), label: `${label} ativos`, detail: 'Acompanhamento aceito' },
    { tone: 'orange', icon: <ClockIcon />, value: numberOrZero(stats.pending), label: 'Convites pendentes', detail: 'Aguardando aceite' },
    { tone: 'purple', icon: <CalendarIcon />, value: formatDate(stats.latest_update), label: 'Última atualização', detail: 'Mais recente' },
  ]

  const refreshPatients = useCallback(async () => {
    try {
      setLoading(true)
      const { data, meta: pagination } = await listClients({
        page: searchPage,
        perPage: 10,
        search,
        withMeta: true,
      })
      setPatients(data)
      setMeta(pagination)
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setLoading(false)
    }
  }, [search, searchPage, toast])

  useEffect(() => {
    refreshPatients()
  }, [refreshPatients])

  function openAdd() {
    setForm(emptyForm())
    setErrors({})
    setModalOpen(true)
  }

  function updateForm(nextForm) {
    setForm(nextForm)
    setErrors((current) => {
      const next = { ...current }
      Object.keys(nextForm).forEach((key) => {
        if (nextForm[key] !== form[key]) delete next[key]
      })
      return next
    })
  }

  async function savePatient() {
    const nextErrors = validateClientPayload(form)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      toast.warning('Revise os campos destacados.')
      return
    }

    try {
      setSaving(true)
      const created = await inviteClient(form)
      setSearchPage(1)
      setPatients((current) => [created, ...current.filter((patient) => patient.uuid !== created.uuid)].slice(0, 10))
      setModalOpen(false)
      toast.success('Convite enviado com sucesso.')
      refreshPatients()
    } catch (error) {
      const formErrors = clientErrorToFormErrors(error)
      setErrors(formErrors)
      toast.warning(Object.values(formErrors)[0] || error.message)
    } finally {
      setSaving(false)
    }
  }

  async function startPatientChat(patient) {
    if (!patient?.uuid) return

    try {
      setStartingChatUuid(patient.uuid)
      const conversation = await startConversationWithClient(patient.uuid)
      navigate(`/dashboard/messages?conversation=${conversation.uuid}`)
    } catch (error) {
      toast.warning(error.message)
    } finally {
      setStartingChatUuid('')
    }
  }

  return (
    <div className="people-list-page">
      <header className="people-hero">
        <span className="people-hero-icon" aria-hidden="true"><UsersIcon /></span>
        <div>
          <h1>{label}</h1>
          <p>{loading ? `Carregando ${label.toLowerCase()}...` : countText(meta?.total ?? normalizedPatients.length, singular)}</p>
        </div>
        <button type="button" className="people-new-button" onClick={openAdd}>
          <UserPlusIcon />
          Novo {isTrainer ? 'Aluno' : 'Paciente'}
        </button>
      </header>

      <section className="people-stat-grid" aria-label={`Resumo de ${label.toLowerCase()}`}>
        {statCards.map((card) => (
          <article className="people-stat-card" key={card.label}>
            <span className={`people-stat-icon is-${card.tone}`} aria-hidden="true">{card.icon}</span>
            <div>
              <strong>{loading ? '-' : card.value}</strong>
              <p>{card.label}</p>
              <small>{card.detail}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="people-panel">
        <div className="people-panel-head">
          <div>
            <span aria-hidden="true"><ListIcon /></span>
            <h2>Meus {label}</h2>
          </div>
          <label className="people-search">
            <SearchIcon />
            <input
              value={search}
              placeholder={`Buscar ${singular}...`}
              onChange={(event) => {
                setSearch(event.target.value)
                setSearchPage(1)
              }}
            />
          </label>
        </div>

        <div className="people-table-wrap">
          <table className="people-table">
            <thead>
              <tr>
                <th>{isTrainer ? 'Aluno' : 'Paciente'}</th>
                <th>Status</th>
                <th>Altura</th>
                <th>Peso</th>
                <th>Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="people-empty">Carregando {label.toLowerCase()}...</td></tr>
              ) : normalizedPatients.length ? (
                normalizedPatients.map((patient) => (
                  <tr key={patient.uuid}>
                    <td><PersonCell patient={patient} linkTo={clientProfilePath(patient)} /></td>
                    <td><StatusBadge status={patient.status} /></td>
                    <td><IconText icon={<HeightIcon />} primary={patient.height} /></td>
                    <td><IconText icon={<WeightIcon />} primary={patient.weight} /></td>
                    <td><IconText icon={<CalendarIcon />} primary={patient.updated} /></td>
                    <td>
                      <ActionLinks patient={patient} isTrainer={isTrainer} startingChat={startingChatUuid === patient.uuid} onMessage={startPatientChat} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="people-empty">Nenhum {singular} encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="people-mobile-list">
          {loading ? (
            <div className="people-empty">Carregando {label.toLowerCase()}...</div>
          ) : normalizedPatients.length ? (
            normalizedPatients.map((patient) => (
              <article className="people-mobile-card" key={patient.uuid}>
                <PersonCell patient={patient} linkTo={clientProfilePath(patient)} />
                <IconText icon={<MailIcon />} primary={patient.email} secondary="E-mail" />
                <div className="people-mobile-metrics">
                  <IconText icon={<HeightIcon />} primary={patient.height} secondary="Altura" />
                  <IconText icon={<WeightIcon />} primary={patient.weight} secondary="Peso" />
                </div>
                <IconText icon={<CalendarIcon />} primary={patient.updated} secondary="Atualização" />
                <StatusBadge status={patient.status} />
                <ActionLinks patient={patient} isTrainer={isTrainer} mobile startingChat={startingChatUuid === patient.uuid} onMessage={startPatientChat} />
              </article>
            ))
          ) : (
            <div className="people-empty">Nenhum {singular} encontrado.</div>
          )}
        </div>

        <Pagination meta={meta} onPageChange={setSearchPage} />
      </section>

      <PatientFormModal open={modalOpen} form={form} errors={errors} loading={saving} onClose={() => setModalOpen(false)} onSave={savePatient} onChange={updateForm} />
    </div>
  )
}

function PersonCell({ patient, linkTo = '' }) {
  const content = (
    <>
      <span className="people-avatar" aria-hidden="true">
        {patient.avatar ? <img src={patient.avatar} alt="" /> : patient.initials}
      </span>
      <div>
        <strong>{patient.name}</strong>
        <small>{patient.email}</small>
      </div>
      <ChevronRightIcon />
    </>
  )

  if (linkTo) return <Link className="people-person-cell is-link" to={linkTo}>{content}</Link>

  return <div className="people-person-cell">{content}</div>
}

function ActionLinks({ patient, isTrainer, mobile = false, startingChat = false, onMessage }) {
  return (
    <div className={`people-actions ${mobile ? 'is-mobile' : ''}`}>
      <button type="button" aria-label={`Mensagem para ${patient.name}`} onClick={() => onMessage?.(patient)} disabled={startingChat}>
        <SmallMessageIcon />
      </button>
      {isTrainer ? (
        <Link to="/dashboard/workouts" state={{ patient }}>Ver treinos</Link>
      ) : (
        <Link to="/dashboard/meal-plans" state={{ patient }}>Ver planos</Link>
      )}
      {isTrainer ? (
        <Link to="/dashboard/workouts/new" state={{ patient }}>Novo treino</Link>
      ) : (
        <Link to="/dashboard/plans" state={{ patient }}>Novo plano</Link>
      )}
    </div>
  )
}

function IconText({ icon, primary, secondary }) {
  return (
    <div className="people-icon-text">
      <span aria-hidden="true">{icon}</span>
      <div>
        <strong>{primary}</strong>
        {secondary ? <small>{secondary}</small> : null}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const labels = { active: 'Ativo', pending: 'Pendente', inactive: 'Inativo' }
  return <span className={`people-status is-${status}`}><i aria-hidden="true" />{labels[status] || 'Pendente'}</span>
}

function normalizePatient(patient) {
  const status = normalizeStatus(patient.status || patient.pivot?.status)
  const name = patient.name || 'Paciente sem nome'

  return {
    uuid: patient.uuid || patient.id || patient.email || name,
    name,
    email: patient.email || 'email não informado',
    initials: initials(name),
    avatar: normalizeAvatarUrl(patient.avatar),
    status,
    height: patient.height ? `${patient.height} cm` : '-',
    weight: patient.weight ? `${patient.weight} kg` : '-',
    updated: relativeDate(patient.updated_at || patient.created_at),
  }
}

function normalizeStatus(status) {
  if (['active', 'accepted', 'invitation_accepted', 'accepted_invite'].includes(status)) return 'active'
  if (['inactive', 'archived'].includes(status)) return 'inactive'
  return 'pending'
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0][0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'PA'
}

function relativeDate(value) {
  if (!value) return 'Hoje'
  const date = parseLocalDate(value)
  if (Number.isNaN(date.getTime())) return 'Hoje'
  const diffDays = Math.max(0, Math.floor((startOfDay(new Date()) - startOfDay(date)) / 86400000))
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays} dias`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas`
  return `${Math.floor(diffDays / 30)} meses`
}

function formatDate(value) {
  if (!value) return '-'
  const [year, month, day] = String(value).slice(0, 10).split('-')
  if (year && month && day) return `${day}/${month}/${year}`
  return '-'
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

function countText(total, singular) {
  const plural = singular === 'aluno' ? 'alunos' : 'pacientes'
  return `${total} ${total === 1 ? singular : plural} ${total === 1 ? 'encontrado' : 'encontrados'}`
}

function clientProfilePath(client) {
  return client?.uuid ? `/dashboard/clients/${client.uuid}` : ''
}

function UserPlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM18 8v6M15 11h6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function UsersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CheckCircleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 12l2 2 4-5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M5 5h14v16H5V5Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m20 20-4.2-4.2M18 10.8a7.2 7.2 0 1 1-14.4 0 7.2 7.2 0 0 1 14.4 0Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
}

function SmallMessageIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 6h14v10H8l-3 3V6Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>
}

function ListIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function HeightIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function WeightIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 8h10l2 12H5L7 8ZM9 8a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16v12H4V6ZM4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ChevronRightIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
