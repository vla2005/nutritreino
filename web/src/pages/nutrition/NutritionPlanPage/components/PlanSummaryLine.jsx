import { Link } from 'react-router-dom'

export function SummaryLine({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function ProfessionalSummaryLine({ label, professional }) {
  return (
    <div>
      <span>{label}</span>
      {professional?.uuid ? (
        <Link className="plan-professional-link" to={`/dashboard/professionals/${professional.uuid}`}>
          {professional.name || 'Profissional'}
        </Link>
      ) : (
        <strong>{professional?.name || '-'}</strong>
      )}
    </div>
  )
}
