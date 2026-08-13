import AuthLayout from '@/features/auth/components/AuthLayout/AuthLayout.jsx'
import InvitationContent from './components/InvitationContent.jsx'
import { useAcceptInvitation } from './hooks/useAcceptInvitation.js'
import './AcceptInvitePage.css'

const heroStats = [
  { value: '1', label: 'Convite' },
  { value: '7d', label: 'Validade' },
  { value: '100%', label: 'Seguro' },
]

export default function AcceptInvitePage() {
  const invitation = useAcceptInvitation()
  const heroDescription = invitation.professional?.name
    ? `${invitation.professional.name} convidou voce para acompanhar seu plano pela plataforma.`
    : 'Seu profissional convidou voce para acompanhar seus planos pela plataforma.'

  return (
    <AuthLayout
      className="accept-invite-page"
      formAriaLabel="Aceitar convite"
      heroAriaLabel="Convite NutriTreino"
      heroDescription={heroDescription}
      heroStats={heroStats}
      heroTitle="Crie sua senha para acessar seus planos"
      shellClassName="accept-invite-shell"
    >
      <InvitationContent invitation={invitation} />
    </AuthLayout>
  )
}
