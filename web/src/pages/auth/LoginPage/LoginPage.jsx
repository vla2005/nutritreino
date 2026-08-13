import AuthLayout from '@/features/auth/components/AuthLayout/AuthLayout.jsx'
import LoginForm from './components/LoginForm.jsx'
import './LoginPage.css'

const heroStats = [
  { value: '200+', label: 'Profissionais' },
  { value: '1.500+', label: 'Alunos ativos' },
  { value: '5.000+', label: 'Planos criados' },
]

export default function LoginPage() {
  return (
    <AuthLayout
      formAriaLabel="Formulario de login"
      heroAriaLabel="Apresentacao NutriTreino"
      heroDescription="Centralize planos alimentares, treinos fisicos e o acompanhamento de seus alunos em uma unica plataforma."
      heroStats={heroStats}
      heroTitle="Gestao integrada de nutricao e treinos"
    >
      <LoginForm />
    </AuthLayout>
  )
}
