import { useId } from 'react'

export default function PlanSectionCard({ title, subtitle, icon, expanded, onToggle, onRemove, removeLabel, children }) {
  const bodyId = useId()
  const headingId = useId()
  return (
    <article className="plan-meal-card">
      <header className="plan-meal-header">
        <h3 className="plan-section-heading">
          <button type="button" className="plan-section-toggle" aria-expanded={expanded} aria-controls={bodyId} id={headingId} onClick={onToggle}>
            <span className="plan-meal-title">
              <span aria-hidden="true">{icon}</span>
              <span className="plan-section-copy"><strong>{title}</strong><span>{subtitle}</span></span>
            </span>
            <svg className={`plan-section-chevron ${expanded ? 'is-open' : ''}`} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m8 10 4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </h3>
        {onRemove ? <button type="button" className="plan-section-remove" onClick={onRemove} aria-label={removeLabel}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M9 7l1-3h4l1 3M7 7l1 14h8l1-14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></button> : null}
      </header>
      <div id={bodyId} role="region" aria-labelledby={headingId} hidden={!expanded} className={`plan-meal-body ${expanded ? 'is-open' : ''}`}>
        <div className="plan-meal-body-inner">{children}</div>
      </div>
    </article>
  )
}
