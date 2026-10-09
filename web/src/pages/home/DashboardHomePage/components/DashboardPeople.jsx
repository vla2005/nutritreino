import { CheckCircleIcon, ClipboardTextIcon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { normalizeAvatarUrl } from '@/utils/avatar.js'
import AvatarImage from '@/shared/components/ui/AvatarImage/AvatarImage.jsx'

export function PatientAvatar({ person, size = 'normal' }) {
  const avatar = normalizeAvatarUrl(person?.avatar)
  const parts = (person?.name || 'Cliente').trim().split(/\s+/)
  const initials = `${parts[0]?.[0] || ''}${parts.length > 1 ? parts.at(-1)[0] : ''}`
  return (
    <span className={`nt-person-avatar is-${size}`} aria-hidden="true">
      <AvatarImage src={avatar} fallback={initials.toUpperCase()} />
    </span>
  )
}

export function AttentionPatients({ items = [], trainer = false }) {
  return (
    <section className="nt-panel nt-attention">
      <header className="nt-panel-head">
        <h2>{trainer ? 'Alunos' : 'Pacientes'} que precisam de atenção</h2>
        <Link to="/patients">Ver todos</Link>
      </header>
      {items.length ? (
        <div className="nt-attention-list">
          {items.slice(0, 3).map((item) => {
            const person = item.client || item.student
            return (
              <div
                className="nt-attention-row"
                key={`${person?.uuid}-${item.reason}`}
              >
                <PatientAvatar person={person} />
                <div className="nt-person-copy">
                  <strong>{person?.name || 'Cliente'}</strong>
                  <span>{item.reason}</span>
                </div>
                <Link
                  className="nt-row-action"
                  to={
                    person?.uuid
                      ? `/dashboard/clients/${person.uuid}`
                      : '/patients'
                  }
                  aria-label={`Acompanhar ${person?.name || 'cliente'}`}
                >
                  {item.action === 'plan' ? 'Revisar' : 'Acompanhar'}
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="nt-panel-empty">
          <CheckCircleIcon size={32} weight="light" />
          <strong>Tudo em dia por aqui</strong>
          <p>
            Os acompanhamentos que precisarem de atenção aparecerão nesta lista.
          </p>
        </div>
      )}
    </section>
  )
}

export function LatestCheckIns({ items = [], trainer = false }) {
  return (
    <section className="nt-panel nt-checkins">
      <header className="nt-panel-head">
        <h2>Últimos check-ins</h2>
        <Link to="/patients">Ver todos</Link>
      </header>
      {items.length ? (
        <div className="nt-checkin-table">
          <table>
            <thead>
              <tr>
                <th>{trainer ? 'Aluno' : 'Paciente'}</th>
                <th>Data</th>
                <th>
                  <span className="nt-sr-only">Ação</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 3).map((item) => (
                <tr key={item.uuid}>
                  <td>
                    <div className="nt-person-cell">
                      <PatientAvatar person={item.client} size="small" />
                      <strong>{item.client?.name || 'Cliente'}</strong>
                    </div>
                  </td>
                  <td>{item.label || '—'}</td>
                  <td>
                    <Link
                      to={
                        item.client?.uuid
                          ? `/dashboard/progress?client_uuid=${item.client.uuid}`
                          : '/patients'
                      }
                      aria-label={`Ver check-in de ${item.client?.name || 'cliente'}`}
                    >
                      Ver check-in
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="nt-panel-empty">
          <ClipboardTextIcon size={32} weight="light" />
          <strong>Os primeiros check-ins chegam aqui</strong>
          <p>
            Quando {trainer ? 'seus alunos' : 'seus pacientes'} registrarem o
            progresso, você poderá acompanhar cada atualização.
          </p>
        </div>
      )}
    </section>
  )
}
