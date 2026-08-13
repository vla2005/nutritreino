import AuthLayout from '@/features/auth/components/AuthLayout/AuthLayout.jsx'
import VerificationStatus from './components/VerificationStatus.jsx'
import { useEmailVerification } from './hooks/useEmailVerification.js'
import './VerifyEmailPage.css'

const heroStats = [
  { value: '1', label: 'Conta ativa' },
  { value: '2min', label: 'Validacao' },
  { value: '100%', label: 'Seguro' },
]

export default function VerifyEmailPage() {
  const status = useEmailVerification()

  return (
    <AuthLayout
      className="verify-page"
      formAriaLabel="Status de verificacao"
      heroAriaLabel="Verificacao NutriTreino"
      heroDescription="A verificacao protege sua conta profissional e mantem os dados dos seus alunos em um ambiente confiavel."
      heroStats={heroStats}
      heroTitle="Confirme seu e-mail para ativar o acesso"
      shellClassName="verify-shell"
    >
      <VerificationStatus status={status} />
    </AuthLayout>
  )
}
