import { Link } from 'react-router-dom'

export default function PlanOverview({ title, fields, notes, professional }) {
  return (
    <section className="plan-card plan-overview">
      <h2>{title}</h2>
      <dl>{fields.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value || 'Não informado'}</dd></div>)}</dl>
      {professional ? <p className="plan-overview-author">Por {professional.uuid ? <Link to={`/dashboard/professionals/${professional.uuid}`}>{professional.name}</Link> : professional.name}</p> : null}
      {notes?.trim() ? <div className="plan-reading-notes"><h3>Orientações gerais</h3><p>{notes}</p></div> : null}
    </section>
  )
}
