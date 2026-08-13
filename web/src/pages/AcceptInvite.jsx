import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '@/shared/components/ui/Button/Button.jsx'
import PasswordInput from '@/shared/components/ui/PasswordInput/PasswordInput.jsx'
import { useToast } from '../composables/useToast.jsx'
import { acceptClientInvitation, getClientInvitation, validateAcceptInvitePassword } from '../services/invitations.js'

export default function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const token = searchParams.get('token') || ''
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let mounted = true

    async function loadInvite() {
      if (!token) {
        setError('Convite inválido. O token não foi informado.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setInvite(await getClientInvitation(token))
      } catch (err) {
        if (mounted) setError(inviteErrorMessage(err.message))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadInvite()

    return () => {
      mounted = false
    }
  }, [token])

  const client = invite?.client
  const professional = invite?.professional
  const requiresPassword = invite?.requires_password !== false
  const details = useMemo(() => clientDetails(client), [client])

  function updatePassword(patch) {
    setForm((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      Object.keys(patch).forEach((key) => delete next[key])
      return next
    })
  }

  async function handleSubmit() {
    const nextErrors = requiresPassword ? validateAcceptInvitePassword(form) : {}
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      toast.warning('Revise os campos destacados.')
      return
    }

    try {
      setSaving(true)
      await acceptClientInvitation({ token, ...(requiresPassword ? form : {}) })
      toast.success(requiresPassword ? 'Senha criada com sucesso.' : 'Convite aceito com sucesso.')
      window.setTimeout(() => navigate('/login'), 500)
    } catch (err) {
      setErrors(err.fieldErrors || {})
      toast.warning(Object.values(err.fieldErrors || {})[0] || inviteErrorMessage(err.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="login-page accept-invite-page">
      <aside className="login-hero" aria-label="Convite NutriTreino">
        <div className="login-orb login-orb-large" />
        <div className="login-orb login-orb-small" />

        <div className="login-brand">
          <div className="login-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6.2 13.7c5.4.4 9.8-2.5 10.8-7.7 2.5 7.9-2.7 12.3-8.4 11.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 18c2.2-5.2 5.7-8 10.7-8.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </div>
          <span>NutriTreino</span>
        </div>

        <div className="login-hero-content">
          <h1>Crie sua senha para acessar seus planos</h1>
          <p>{professional?.name ? `${professional.name} convidou você para acompanhar seu plano pela plataforma.` : 'Seu profissional convidou você para acompanhar seus planos pela plataforma.'}</p>

          <dl className="login-stats">
            <div>
              <dt>1</dt>
              <dd>Convite</dd>
            </div>
            <div>
              <dt>7d</dt>
              <dd>Validade</dd>
            </div>
            <div>
              <dt>100%</dt>
              <dd>Seguro</dd>
            </div>
          </dl>
        </div>

        <p className="login-copy">(c) 2026 NutriTreino - Equipe 8, UCB</p>
      </aside>

      <section className="login-auth" aria-label="Aceitar convite">
        <div className="login-form-shell accept-invite-shell">
          {loading ? (
            <div className="accept-state">Carregando convite...</div>
          ) : error ? (
            <div className="accept-error-card">
              <h2>Convite indisponível</h2>
              <p>{error}</p>
              <Link to="/login">Ir para login</Link>
            </div>
          ) : (
            <>
              <header className="login-form-header accept-invite-header">
                <h2>{requiresPassword ? 'Complete seu acesso' : 'Aceite o convite'}</h2>
                <p>{requiresPassword ? 'Confira seus dados cadastrados e crie uma senha.' : 'Confira seus dados cadastrados e aceite o novo acompanhamento.'}</p>
              </header>

              <section className="accept-readonly-card" aria-label="Dados cadastrados">
                <div className="accept-client-title">
                  <span>{initials(client?.name)}</span>
                  <div>
                    <strong>{client?.name}</strong>
                    <small>{client?.email}</small>
                  </div>
                </div>

                <div className="accept-detail-grid">
                  {details.map((detail) => (
                    <div key={detail.label}>
                      <span>{detail.label}</span>
                      <strong>{detail.value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              {requiresPassword ? (
                <div className="accept-password-fields">
                  <PasswordInput label="Senha" placeholder="Crie sua senha" showForgot={false} error={errors.password} value={form.password} onChange={(password) => updatePassword({ password })} />
                  <PasswordInput
                    label="Confirmar senha"
                    placeholder="Confirme sua senha"
                    showForgot={false}
                    error={errors.password_confirmation}
                    value={form.password_confirmation}
                    onChange={(password_confirmation) => updatePassword({ password_confirmation })}
                  />
                  <Button loading={saving} placeholder="Criar senha" onClick={handleSubmit} />
                </div>
              ) : (
                <div className="accept-password-fields">
                  <Button loading={saving} placeholder="Aceitar convite" onClick={handleSubmit} />
                  <Link to="/login" className="accept-login-link">Entrar com minha conta</Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}

function clientDetails(client) {
  if (!client) return []

  return [
    { label: 'Telefone', value: formatPhone(client.phone) },
    { label: 'CPF', value: formatCpf(client.cpf) },
    { label: 'Gênero', value: genderLabel(client.gender) },
    { label: 'Nascimento', value: formatDate(client.birth_date) },
    { label: 'Altura', value: client.height ? `${client.height} cm` : 'Não informado' },
    { label: 'Peso', value: client.weight ? `${client.weight} kg` : 'Não informado' },
  ]
}

function inviteErrorMessage(message) {
  if (message === 'Invalid invitation token') return 'O link do convite e invalido ou ja foi utilizado.'
  if (message === 'Invitation token expired') return 'O link do convite expirou. Solicite um novo convite.'
  if (message === 'This email is already registered with another role') return 'Este e-mail ja esta cadastrado com outro tipo de perfil.'
  return message
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
  if (!digits) return 'Não informado'
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatCpf(value) {
  const digits = onlyDigits(value)
  if (!digits) return 'Não informado'
  if (digits.length !== 11) return digits
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function genderLabel(value) {
  return { male: 'Masculino', female: 'Feminino' }[value] || 'Não informado'
}

function formatDate(value) {
  if (!value) return 'Não informado'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}
