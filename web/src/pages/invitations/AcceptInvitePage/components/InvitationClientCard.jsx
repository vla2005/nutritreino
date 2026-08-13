import { clientDetails, initials } from '../utils/invitationFormatters.js'

export default function InvitationClientCard({ client }) {
  return (
    <section className="accept-readonly-card" aria-label="Dados cadastrados">
      <div className="accept-client-title">
        <span>{initials(client?.name)}</span>
        <div>
          <strong>{client?.name}</strong>
          <small>{client?.email}</small>
        </div>
      </div>

      <div className="accept-detail-grid">
        {clientDetails(client).map((detail) => (
          <div key={detail.label}>
            <span>{detail.label}</span>
            <strong>{detail.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
