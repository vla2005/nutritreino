import { Link } from 'react-router-dom'

const statusCopy = {
  loading: {
    title: 'Verificando seu email',
    description: 'Estamos validando o link de confirmacao enviado para o seu email.',
  },
  success: {
    title: 'Email verificado com sucesso',
    description: 'Sua conta foi confirmada. Agora voce pode entrar e continuar o acesso normalmente.',
  },
  error: {
    title: 'Nao foi possivel verificar seu email',
    description: 'O link pode estar invalido, expirado ou ja ter sido utilizado. Solicite um novo link se necessario.',
  },
}

const statusClasses = {
  loading: 'is-loading',
  success: 'is-success',
  error: 'is-error',
}

export default function VerificationStatus({ status }) {
  const copy = statusCopy[status] || statusCopy.loading

  return (
    <>
      <div className={`verify-status-icon ${statusClasses[status] || statusClasses.loading}`}>
        <StatusIcon status={status} />
      </div>

      <header className="login-form-header verify-header">
        <p>Verificacao de e-mail</p>
        <h2>{copy.title}</h2>
        <span>{copy.description}</span>
      </header>

      <div className="verify-actions">
        <Link to="/login" className="verify-primary">Ir para login</Link>
        <Link to="/register" className="verify-secondary">Criar outra conta</Link>
      </div>
    </>
  )
}

function StatusIcon({ status }) {
  if (status === 'success') return <CheckIcon />
  if (status === 'error') return <WarningIcon />
  return <LoadingIcon />
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
  return <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
}

function WarningIcon() {
  return <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
}
