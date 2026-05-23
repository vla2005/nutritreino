import LoginForm from '../components/login/LoginForm.jsx'

export default function Login() {
  return (
    <main className="login-page">
      <aside className="login-hero" aria-label="Apresentacao NutriTreino">
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
          <h1>Gestao integrada de nutricao e treinos</h1>
          <p>Centralize planos alimentares, treinos fisicos e o acompanhamento de seus alunos em uma unica plataforma.</p>

          <dl className="login-stats">
            <div>
              <dt>200+</dt>
              <dd>Profissionais</dd>
            </div>
            <div>
              <dt>1.500+</dt>
              <dd>Alunos ativos</dd>
            </div>
            <div>
              <dt>5.000+</dt>
              <dd>Planos criados</dd>
            </div>
          </dl>
        </div>

        <p className="login-copy">(c) 2026 NutriTreino - Equipe 8, UCB</p>
      </aside>

      <section className="login-auth" aria-label="Formulario de login">
        <div className="login-form-shell">
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
