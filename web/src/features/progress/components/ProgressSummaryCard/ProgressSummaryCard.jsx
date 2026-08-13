export default function ProgressSummaryCard({ tone, icon, label, value, detail }) {
  return (
    <article className="progress-summary-card">
      <span className={`is-${tone}`} aria-hidden="true">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  )
}
