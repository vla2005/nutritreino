import { Link } from 'react-router-dom'
import InvitationClientCard from './InvitationClientCard.jsx'
import InvitationPasswordForm from './InvitationPasswordForm.jsx'

export default function InvitationContent({ invitation }) {
  if (invitation.loading) return <div className="accept-state">Carregando convite...</div>

  if (invitation.error) {
    return (
      <div className="accept-error-card">
        <h2>Convite indisponivel</h2>
        <p>{invitation.error}</p>
        <Link to="/login">Ir para login</Link>
      </div>
    )
  }

  return (
    <>
      <header className="login-form-header accept-invite-header">
        <h2>{invitation.requiresPassword ? 'Complete seu acesso' : 'Aceite o convite'}</h2>
        <p>{invitation.requiresPassword ? 'Confira seus dados cadastrados e crie uma senha.' : 'Confira seus dados cadastrados e aceite o novo acompanhamento.'}</p>
      </header>

      <InvitationClientCard client={invitation.client} />
      <InvitationPasswordForm
        errors={invitation.errors}
        form={invitation.form}
        requiresPassword={invitation.requiresPassword}
        saving={invitation.saving}
        onChange={invitation.updatePassword}
        onSubmit={invitation.submit}
      />
    </>
  )
}
