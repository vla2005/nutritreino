import AuthLayout from '@/features/auth/components/AuthLayout/AuthLayout.jsx'
import RegisterForm from './components/RegisterForm.jsx'
import './RegisterPage.css'

const heroStats = [
  { value: '3', label: 'Passos simples' },
  { value: '100%', label: 'Profissional' },
  { value: '24h', label: 'Acesso online' },
]

export default function RegisterPage() {
  return (
    <AuthLayout
      className="register-page"
      formAriaLabel="Formulario de cadastro"
      heroAriaLabel="Cadastro NutriTreino"
      heroDescription="Cadastre seu perfil profissional, organize pacientes e acompanhe planos de nutricao e treino com mais clareza."
      heroStats={heroStats}
      heroTitle="Comece com seus alunos em uma unica plataforma"
      shellClassName="register-form-shell"
    >
      <RegisterForm />
    </AuthLayout>
  )
}
