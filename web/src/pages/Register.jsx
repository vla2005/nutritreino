import RegisterForm from '../components/register/RegisterForm.jsx'

export default function Register() {
  return (
    <main className="login-page register-page">
      <aside className="login-hero" aria-label="Cadastro NutriTreino">
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
          <h1>Comece com seus alunos em uma unica plataforma</h1>
          <p>Cadastre seu perfil profissional, organize pacientes e acompanhe planos de nutricao e treino com mais clareza.</p>

          <dl className="login-stats">
            <div>
              <dt>3</dt>
              <dd>Passos simples</dd>
            </div>
            <div>
              <dt>100%</dt>
              <dd>Profissional</dd>
            </div>
            <div>
              <dt>24h</dt>
              <dd>Acesso online</dd>
            </div>
          </dl>
        </div>

        <p className="login-copy">(c) 2026 NutriTreino - Equipe 8, UCB</p>
      </aside>

      <section className="login-auth" aria-label="Formulario de cadastro">
        <div className="login-form-shell register-form-shell">
          <RegisterForm />
        </div>
      </section>
    </main>
  )
}
