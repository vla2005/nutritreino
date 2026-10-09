import { useLocation } from 'react-router-dom'
import AuthLayout from '@/features/auth/components/AuthLayout/AuthLayout.jsx'
import CheckEmailInstructions from './components/CheckEmailInstructions.jsx'
import './CheckEmailPage.css'

export default function CheckEmailPage() {
  const { state } = useLocation()
  const email = typeof state?.email === 'string' ? state.email.trim() : ''

  return (
    <AuthLayout
      className="check-email-page"
      formAriaLabel="Confirmação de e-mail pendente"
      heroAriaLabel="Ativação da conta NutriTreino"
      heroTitle="Seu próximo passo está no e-mail"
      heroDescription="Confirme seu endereço para começar a organizar pacientes, alunos e acompanhamentos no NutriTreino."
      heroStats={[]}
      shellClassName="check-email-shell"
    >
      <CheckEmailInstructions email={email} />
    </AuthLayout>
  )
}
