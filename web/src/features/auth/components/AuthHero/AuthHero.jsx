import AuthBrand from '../AuthBrand/AuthBrand.jsx'

export default function AuthHero({ ariaLabel, title, description, stats }) {
  return (
    <aside className="login-hero" aria-label={ariaLabel}>
      <div className="login-orb login-orb-large" />
      <div className="login-orb login-orb-small" />

      <AuthBrand />

      <div className="login-hero-content">
        <h1>{title}</h1>
        <p>{description}</p>

        <dl className="login-stats">
          {stats.map((stat) => (
            <div key={`${stat.value}-${stat.label}`}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="login-copy">(c) 2026 NutriTreino - Equipe 8, UCB</p>
    </aside>
  )
}
