import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../composables/useAuth.js'
import { useToast } from '../../composables/useToast.jsx'
import { getClient } from '../../services/clients.js'
import { startConversationWithClient } from '../../services/messages.js'
import { normalizeAvatarUrl } from '../../utils/avatar.js'

export default function ClientProfile() {
  const { uuid } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startingChat, setStartingChat] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadClient() {
      try {
        setLoading(true)
        setError('')
        const data = await getClient(uuid)
        if (mounted) setClient(data)
      } catch (err) {
        if (mounted) {
          setError(err.message)
          toast.warning(err.message)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadClient()

    return () => {
      mounted = false
    }
  }, [toast, uuid])

  const contactItems = useMemo(() => contactDetails(client), [client])
  const healthItems = useMemo(() => healthDetails(client), [client])
  const displayName = clientDisplayName(client)
  const initialsText = initials(displayName)
  const avatarUrl = normalizeAvatarUrl(client?.avatar)
  const isNutritionist = user?.professional?.speciality === 'nutritionist'
  const isProfessional = user?.role === 'professional'

  async function handleStartChat() {
    if (!client?.uuid) return

    try {
      setStartingChat(true)
      const conversation = await startConversationWithClient(client.uuid)
      navigate(`/dashboard/messages?conversation=${conversation.uuid}`)
    } catch (err) {
      toast.warning(err.message)
    } finally {
      setStartingChat(false)
    }
  }

  return (
    <div className="professional-profile-page">
      <header className="professional-page-header">
        <button type="button" className="professional-back-button" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeftIcon />
        </button>
        <div>
          <h1>Perfil do Cliente</h1>
          <p>Informações completas do paciente ou aluno acompanhado</p>
        </div>
      </header>

      {loading ? (
        <section className="professional-profile-shell is-loading">
          <div className="professional-skeleton is-wide" />
          <div className="professional-skeleton" />
          <div className="professional-skeleton is-short" />
        </section>
      ) : error ? (
        <section className="professional-profile-shell">
          <div className="professional-empty-state">
            <h2>Não foi possível abrir este perfil</h2>
            <p>{error}</p>
            <button type="button" onClick={() => navigate(-1)}>Voltar</button>
          </div>
        </section>
      ) : (
        <main className="professional-profile-shell client-profile-shell">
          <section className="professional-cover is-client">
            <div className="professional-cover-content">
              <div className="professional-avatar" aria-hidden="true">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initialsText}</span>}
              </div>
              <div>
                <span className="professional-eyebrow">{statusLabel(client?.status)}</span>
                <h2>{displayName}</h2>
                <strong>{clientSummary(client)}</strong>
              </div>
            </div>
          </section>

          <section className="professional-meta-strip">
            <div className="professional-meta-list">
              <ProfileMeta icon={<UserIcon />} value={`Status: ${statusLabel(client?.status)}`} />
              <ProfileMeta icon={<CalendarIcon />} value={`Perfil desde ${formatDate(client?.created_at)}`} />
              <ProfileMeta icon={<RefreshIcon />} value={`Atualizado em ${formatDateTime(client?.updated_at)}`} />
            </div>
            <div className="client-profile-meta-actions">
              {isProfessional ? (
                <button type="button" className="professional-message-button" onClick={handleStartChat} disabled={startingChat}>
                  <ChatIcon />
                  {startingChat ? 'Abrindo...' : 'Enviar mensagem'}
                </button>
              ) : null}
              {isNutritionist ? (
                <Link className="professional-message-button is-secondary-action" to="/dashboard/meal-plans" state={{ patient: client }}>
                  <AppleIcon />
                  Ver planos
                </Link>
              ) : null}
              <Link className="professional-message-button" to={`/dashboard/progress?client_uuid=${client?.uuid || ''}`} state={{ client }}>
                <ProgressIcon />
                Ver progresso
              </Link>
            </div>
          </section>

          <section className="professional-stats-grid client-profile-stats" aria-label="Resumo do cliente">
            <ProfileStat icon={<MailIcon />} value={client?.email || '-'} label="Email" />
            <ProfileStat icon={<PhoneIcon />} value={formatPhone(client?.phone) || '-'} label="Telefone" />
            <ProfileStat icon={<HeightIcon />} value={client?.height ? `${client.height} cm` : '-'} label="Altura" />
            <ProfileStat icon={<ScaleIcon />} value={client?.weight ? `${client.weight} kg` : '-'} label="Peso" />
          </section>

          <section className="professional-main-grid">
            <article className="professional-section-card">
              <h3>Contato</h3>
              <div className="client-profile-facts">
                {contactItems.map((item) => <ProfileFact key={item.label} label={item.label} value={item.value} />)}
              </div>
            </article>

            <article className="professional-section-card">
              <h3>Dados fisicos</h3>
              <div className="client-profile-facts">
                {healthItems.map((item) => <ProfileFact key={item.label} label={item.label} value={item.value} />)}
              </div>
            </article>
          </section>

          <section className="professional-section-card professional-services client-profile-actions">
            <h3>Ações rápidas</h3>
            <p>Abra as listas filtradas por este cliente para revisar os planos e treinos vinculados.</p>
            <div className="professional-service-grid">
              <Link to={`/dashboard/progress?client_uuid=${client?.uuid || ''}`} state={{ client }}>
                <span><ProgressIcon /></span>
                <div>
                  <h4>Ver progresso</h4>
                  <p>Acompanhe peso, medidas, fotos e check-ins liberados pelo cliente.</p>
                  <small>Progresso</small>
                </div>
              </Link>
              <Link to="/dashboard/meal-plans" state={{ patient: client }}>
                <span><AppleIcon /></span>
                <div>
                  <h4>Planos alimentares</h4>
                  <p>Revise dietas e prescrições vinculadas a este cliente.</p>
                  <small>Dietas</small>
                </div>
              </Link>
              <Link to="/dashboard/workouts" state={{ patient: client }}>
                <span><DumbbellIcon /></span>
                <div>
                  <h4>Treinos</h4>
                  <p>Veja programas de treino associados ao acompanhamento.</p>
                  <small>Treinos</small>
                </div>
              </Link>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

function ProfileMeta({ icon, value }) {
  return (
    <span className="professional-meta-item">
      {icon}
      {value || 'Não informado'}
    </span>
  )
}

function ProfileStat({ icon, value, label }) {
  return (
    <article className="professional-stat-card">
      <span aria-hidden="true">{icon}</span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        <small>Acompanhamento</small>
      </div>
    </article>
  )
}

function ProfileFact({ label, value }) {
  return (
    <div className="professional-fact">
      <span>{label}</span>
      <strong>{value || 'Não informado'}</strong>
    </div>
  )
}

function contactDetails(client) {
  if (!client) return []
  return [
    { label: 'Email', value: client.email },
    { label: 'Telefone', value: formatPhone(client.phone) },
    { label: 'CPF', value: formatCpf(client.cpf) },
  ]
}

function healthDetails(client) {
  if (!client) return []
  return [
    { label: 'Gênero', value: genderLabel(client.gender) },
    { label: 'Nascimento', value: formatDate(client.birth_date) },
    { label: 'Altura', value: client.height ? `${client.height} cm` : '' },
    { label: 'Peso', value: client.weight ? `${client.weight} kg` : '' },
  ]
}

function clientSummary(client) {
  const height = client?.height ? `${client.height} cm` : ''
  const weight = client?.weight ? `${client.weight} kg` : ''
  const parts = [height, weight].filter(Boolean)
  return parts.length ? parts.join(' - ') : 'Dados de acompanhamento do cliente.'
}

function clientDisplayName(client) {
  const name = String(client?.name || '').trim()
  const registeredName = String(client?.registered_name || '').trim()
  const email = String(client?.email || '').trim()

  if (name && name !== email) return name
  if (registeredName && registeredName !== email) return registeredName
  if (email) return email.split('@')[0]
  return 'Cliente sem nome'
}

function statusLabel(status) {
  if (!status) return 'Ativo'
  if (['active', 'accepted', 'invitation_accepted', 'accepted_invite'].includes(status)) return 'Ativo'
  if (['inactive', 'archived'].includes(status)) return 'Inativo'
  return 'Pendente'
}

function genderLabel(value) {
  return { male: 'Masculino', female: 'Feminino' }[value] || value || ''
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'CL'
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '')
}

function formatPhone(value) {
  const digits = onlyDigits(value)
  if (!digits) return ''
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatCpf(value) {
  const digits = onlyDigits(value)
  if (!digits) return ''
  if (digits.length !== 11) return digits
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatDate(value) {
  if (!value) return ''
  const [year, month, day] = String(value).slice(0, 10).split('-')
  if (year && month && day) return `${day}/${month}/${year}`
  return ''
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDate(value)
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ChatIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H6l-3 2 1-5a8 8 0 1 1 17-5Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M5 5h14v16H5V5Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function RefreshIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 12a8 8 0 0 1-14 5M4 12a8 8 0 0 1 14-5M18 3v4h-4M6 21v-4h4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16v12H4V6ZM4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 5 4 7c0 7.2 5.8 13 13 13l2-2-4-4-2 2c-2.3-.8-4.2-2.7-5-5l2-2-4-4Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function HeightIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4M5 21h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ScaleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h14v16H5V4ZM9 8h6M12 8v4M9 14h6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ProgressIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function AppleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 7c-1.5-2.3-3.4-2.9-5.5-1.8C4.2 6.4 3.4 9.5 4.3 13c1.2 4.6 4.1 7.3 6.4 6.2.8-.4 1.8-.4 2.6 0 2.3 1.1 5.2-1.6 6.4-6.2.9-3.5.1-6.6-2.2-7.8-2.1-1.1-4-.5-5.5 1.8ZM12 6.5c.1-1.8.9-3 2.4-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function DumbbellIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8V16M18 8V16M4 10V14M20 10V14M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
