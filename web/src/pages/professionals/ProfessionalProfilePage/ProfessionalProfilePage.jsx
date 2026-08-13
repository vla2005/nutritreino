import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '@/composables/useToast.jsx'
import { startConversationWithProfessional } from '@/services/messages.js'
import { getProfessional } from '@/services/professionals.js'
import { normalizeAvatarUrl } from '@/utils/avatar.js'
import '@/features/people/styles/ProfilePage.css'
import './ProfessionalProfilePage.css'

export default function ProfessionalProfilePage() {
  const { uuid } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [professional, setProfessional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startingChat, setStartingChat] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadProfessional() {
      try {
        setLoading(true)
        setError('')
        const data = await getProfessional(uuid)
        if (mounted) setProfessional(data)
      } catch (err) {
        if (mounted) {
          setError(err.message)
          toast.warning(err.message)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfessional()

    return () => {
      mounted = false
    }
  }, [toast, uuid])

  const initialsText = initials(professional?.name)
  const avatarUrl = normalizeAvatarUrl(professional?.avatar)
  const speciality = specialityLabel(professional?.speciality)
  const stats = profileStats(professional)
  const specialties = profileSpecialties(professional)
  const services = profileServices(professional)
  const contacts = contactDetails(professional)

  async function handleStartChat() {
    if (!professional?.uuid) return

    try {
      setStartingChat(true)
      const conversation = await startConversationWithProfessional(professional.uuid)
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
          <h1>Perfil do Profissional</h1>
          <p>Informações completas do profissional</p>
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
        <main className="professional-profile-shell">
          <section className={`professional-cover is-${professional?.speciality || 'professional'}`}>
            <div className="professional-cover-content">
              <div className="professional-avatar" aria-hidden="true">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initialsText}</span>}
              </div>
              <div>
                <span className="professional-eyebrow">{speciality}</span>
                <h2>{professional?.name || 'Profissional sem nome'}</h2>
                <strong>{professional?.registration || 'Registro não informado'}</strong>
              </div>
            </div>
          </section>

          <section className="professional-meta-strip">
            <div className="professional-meta-list">
              <ProfileMeta icon={<UserBadgeIcon />} value={`Profissional desde ${yearFromDate(professional?.created_at)}`} />
              <ProfileMeta icon={<PinIcon />} value={professional?.city || 'Brasília - DF'} />
            </div>
            <button type="button" className="professional-message-button" onClick={handleStartChat} disabled={startingChat}>
              <ChatIcon />
              {startingChat ? 'Abrindo...' : 'Enviar mensagem'}
            </button>
          </section>

          <div className="professional-tag-row">
            {specialties.slice(0, 5).map((item) => <span key={item}>{item}</span>)}
          </div>

          <section className="professional-stats-grid" aria-label="Estatísticas do profissional">
            {stats.map((item) => (
              <article className="professional-stat-card" key={item.label}>
                <span aria-hidden="true">{item.icon}</span>
                <div>
                  <strong>{item.value}</strong>
                  <p>{item.label}</p>
                  <small>{item.detail}</small>
                </div>
              </article>
            ))}
          </section>

          <section className="professional-main-grid">
            <article className="professional-section-card professional-about">
              <h3>Sobre</h3>
              <p>{professional?.bio || 'Este profissional ainda não adicionou uma biografia.'}</p>
              <div className="professional-about-badges">
                <span><OnlineIcon /> Atende online</span>
                <span><LanguageIcon /> Portugues</span>
              </div>
            </article>

            <article className="professional-section-card">
              <h3>Especialidades</h3>
              <div className="professional-specialty-grid">
                {specialties.map((item) => (
                  <span key={item}>
                    <SpecialtyIcon />
                    {item}
                  </span>
                ))}
              </div>
            </article>
          </section>

          <section className="professional-section-card professional-services">
            <h3>Serviços e Conteúdos</h3>
            <div className="professional-service-grid">
              {services.map((service) => (
                <article key={service.title}>
                  <span aria-hidden="true">{service.icon}</span>
                  <div>
                    <h4>{service.title}</h4>
                    <p>{service.description}</p>
                    <small>{service.tag}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="professional-section-card professional-contact">
            <h3>Informações de contato</h3>
            <div className="professional-contact-grid">
              {contacts.map((item) => (
                <ProfileContact key={item.label} icon={item.icon} value={item.value} />
              ))}
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
      {value}
    </span>
  )
}

function ProfileContact({ icon, value }) {
  return (
    <span className="professional-contact-item">
      {icon}
      {value || 'Não informado'}
    </span>
  )
}

function profileStats(professional) {
  const isTrainer = professional?.speciality === 'trainer'
  const clients = numberOrZero(professional?.stats?.active_clients)
  const plans = numberOrZero(isTrainer ? professional?.stats?.workout_programs : professional?.stats?.meal_plans)
  const years = yearsSince(professional?.created_at)

  return [
    { icon: <UsersIcon />, value: clients, label: isTrainer ? 'Alunos ativos' : 'Pacientes ativos', detail: clients ? '+5 este mês' : 'Nenhum ativo' },
    { icon: <ClipboardIcon />, value: plans, label: isTrainer ? 'Treinos criados' : 'Planos criados', detail: plans ? '+3 este mês' : 'Começando agora' },
    { icon: <TrophyIcon />, value: `${years} ${years === 1 ? 'ano' : 'anos'}`, label: 'Experiência', detail: `Desde ${yearFromDate(professional?.created_at)}` },
    { icon: <StarIcon />, value: 'Profissional', label: 'Tipo de usuário', detail: specialityLabel(professional?.speciality) },
  ]
}

function profileSpecialties(professional) {
  if (professional?.speciality === 'nutritionist' || professional?.speciality === 'nutrition') {
    return ['Emagrecimento', 'Hipertrofia', 'Reeducação Alimentar', 'Saúde intestinal', 'Performance']
  }

  return ['Musculação', 'Hipertrofia', 'Emagrecimento', 'Condicionamento Físico', 'Força', 'Recomposição Corporal']
}

function profileServices(professional) {
  if (professional?.speciality === 'nutritionist' || professional?.speciality === 'nutrition') {
    return [
      { icon: <ClipboardIcon />, title: 'Planos alimentares personalizados', description: 'Planos ajustados ao seu objetivo, rotina e preferências.', tag: 'Nutrição' },
      { icon: <TargetIcon />, title: 'Acompanhamento individual', description: 'Suporte contínuo para evolução e alcance de resultados.', tag: 'Acompanhamento' },
      { icon: <StarIcon />, title: 'Educação alimentar', description: 'Orientações para criar consistência sem perder flexibilidade.', tag: 'Hábitos' },
    ]
  }

  return [
    { icon: <ClipboardIcon />, title: 'Planos alimentares personalizados', description: 'Planos ajustados ao seu objetivo, rotina e preferências.', tag: 'Nutrição' },
    { icon: <DumbbellIcon />, title: 'Programas de treino personalizados', description: 'Treinos periodizados e adaptados para resultados consistentes.', tag: 'Treino' },
    { icon: <TargetIcon />, title: 'Acompanhamento individual', description: 'Suporte contínuo para evolução e alcance de resultados.', tag: 'Acompanhamento' },
  ]
}

function contactDetails(professional) {
  if (!professional) return []

  return [
    { label: 'Email', icon: <MailIcon />, value: professional.email },
    { label: 'Telefone', icon: <PhoneIcon />, value: formatPhone(professional.phone) },
    { label: 'Localização', icon: <PinIcon />, value: professional.city || 'Brasília - DF' },
    { label: 'Registro', icon: <UserBadgeIcon />, value: professional.registration },
  ]
}

function specialityLabel(value) {
  return {
    trainer: 'Treinador',
    nutritionist: 'Nutricionista',
    nutrition: 'Nutricionista',
  }[value] || value || 'Profissional'
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'PR'
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '')
}

function formatPhone(value) {
  const digits = onlyDigits(value)
  if (!digits) return 'Não informado'
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function yearFromDate(value) {
  if (!value) return new Date().getFullYear()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().getFullYear()
  return date.getFullYear()
}

function yearsSince(value) {
  const created = new Date(value)
  if (!value || Number.isNaN(created.getTime())) return 1
  return Math.max(1, new Date().getFullYear() - created.getFullYear())
}

function numberOrZero(value) {
  return Number(value || 0)
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ChatIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12a8 8 0 0 1-8 8H6l-3 2 1-5a8 8 0 1 1 17-5Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
}

function UserBadgeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 20a6 6 0 0 1 12 0M4 4h16v18H4V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function PinIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 10.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
}

function UsersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 21v-2a3.5 3.5 0 0 0-2.6-3.4M16.5 3.4a4 4 0 0 1 0 7.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ClipboardIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5a3 3 0 0 1 6 0h3v16H6V5h3ZM9 10h6M9 14h6M9 18h3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function TrophyIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4ZM5 6H3v1a4 4 0 0 0 4 4M19 6h2v1a4 4 0 0 1-4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function StarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function OnlineIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 8a6 6 0 0 0 0 8M16 8a6 6 0 0 1 0 8M12 12h.01M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}

function LanguageIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5ZM8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function SpecialtyIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8v8M18 8v8M4 10v4M20 10v4M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function DumbbellIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8V16M18 8V16M4 10V14M20 10V14M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function TargetIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 12h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16v12H4V6ZM4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
