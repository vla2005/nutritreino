import axios from 'axios'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_URL } from '../config/api.js'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const verificationStarted = useRef(false)

  useEffect(() => {
    if (verificationStarted.current) return
    verificationStarted.current = true

    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      return
    }

    axios
      .post(`${API_URL}/verify-email`, { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [searchParams])

  const copy = useMemo(() => {
    if (status === 'success') {
      return {
        title: 'Email verificado com sucesso',
        description: 'Sua conta foi confirmada. Agora você pode entrar e continuar o acesso normalmente.',
      }
    }

    if (status === 'error') {
      return {
        title: 'Não foi possível verificar seu email',
        description: 'O link pode estar invalido, expirado ou ja ter sido utilizado. Solicite um novo link se necessario.',
      }
    }

    return {
      title: 'Verificando seu email',
      description: 'Estamos validando o link de confirmacao enviado para o seu email.',
    }
  }, [status])

  return (
    <main className="login-page verify-page">
      <aside className="login-hero" aria-label="Verificacao NutriTreino">
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
          <h1>Confirme seu e-mail para ativar o acesso</h1>
          <p>A verificação protege sua conta profissional e mantem os dados dos seus alunos em um ambiente confiavel.</p>

          <dl className="login-stats">
            <div>
              <dt>1</dt>
              <dd>Conta ativa</dd>
            </div>
            <div>
              <dt>2min</dt>
              <dd>Validacao</dd>
            </div>
            <div>
              <dt>100%</dt>
              <dd>Seguro</dd>
            </div>
          </dl>
        </div>

        <p className="login-copy">(c) 2026 NutriTreino - Equipe 8, UCB</p>
      </aside>

      <section className="login-auth" aria-label="Status de verificação">
        <div className="login-form-shell verify-shell">
          <div className={`verify-status-icon ${statusClasses[status]}`}>
            {status === 'loading' ? <LoadingIcon /> : status === 'success' ? <CheckIcon /> : <WarningIcon />}
          </div>

          <header className="login-form-header verify-header">
            <p>Verificacao de e-mail</p>
            <h2>{copy.title}</h2>
            <span>{copy.description}</span>
          </header>

          <div className="verify-actions">
            <Link to="/login" className="verify-primary">
              Ir para login
            </Link>
            <Link to="/register" className="verify-secondary">
              Criar outra conta
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

const statusClasses = {
  loading: 'is-loading',
  success: 'is-success',
  error: 'is-error',
}

function LoadingIcon() {
  return (
    <svg className="spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
    </svg>
  )
}
