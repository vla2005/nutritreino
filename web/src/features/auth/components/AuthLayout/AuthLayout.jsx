import AuthHero from '../AuthHero/AuthHero.jsx'

export default function AuthLayout({
  children,
  className = '',
  formAriaLabel,
  heroAriaLabel,
  heroDescription,
  heroStats,
  heroTitle,
  shellClassName = '',
}) {
  return (
    <main className={`login-page ${className}`.trim()}>
      <AuthHero
        ariaLabel={heroAriaLabel}
        title={heroTitle}
        description={heroDescription}
        stats={heroStats}
      />

      <section className="login-auth" aria-label={formAriaLabel}>
        <div className={`login-form-shell ${shellClassName}`.trim()}>{children}</div>
      </section>
    </main>
  )
}
