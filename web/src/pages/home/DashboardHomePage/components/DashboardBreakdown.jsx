import { ChartBarIcon } from '@phosphor-icons/react'

export default function DashboardBreakdown({
  items = [],
  title = 'Distribuição da adesão',
  caption,
}) {
  const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
  return (
    <section className="nt-panel nt-breakdown">
      <header className="nt-panel-head">
        <h2>{title}</h2>
      </header>
      {total ? (
        <>
          <div className="nt-breakdown-list">
            {items.map((item, index) => {
              const percentage = Math.min(
                100,
                Math.max(0, Number(item.percent) || 0)
              )
              return (
                <div className="nt-breakdown-row" key={item.label}>
                  <span>{item.label.split(' (')[0]}</span>
                  <strong>{item.value}</strong>
                  <div
                    className={`nt-meter is-level-${Math.min(index, 3)}`}
                    role="meter"
                    aria-label={item.label}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                  <small>{percentage}%</small>
                </div>
              )
            })}
          </div>
          <p className="nt-breakdown-caption">
            {caption || `Com base em ${total} check-ins com adesão informada`}
          </p>
        </>
      ) : (
        <div className="nt-panel-empty">
          <ChartBarIcon size={32} weight="light" />
          <strong>Ainda sem adesão informada</strong>
          <p>Esta distribuição será preenchida a partir dos check-ins.</p>
        </div>
      )}
    </section>
  )
}

export function DashboardDetails({ data, trainer = false }) {
  const lists = [
    {
      title: trainer ? 'Objetivos dos alunos' : 'Objetivos dos pacientes',
      items: data.goals,
    },
    {
      title: trainer ? 'Programas por status' : 'Planos por status',
      items: trainer ? data.program_status : data.plan_status,
    },
    ...(!trainer ? [{ title: 'Tipos de plano', items: data.plan_types }] : []),
  ]
  return (
    <details className="nt-details">
      <summary>Mais sobre o seu acompanhamento</summary>
      <div className="nt-details-grid">
        {lists.map((list) => (
          <section key={list.title}>
            <h2>{list.title}</h2>
            {list.items?.length ? (
              <dl>
                {list.items.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value ?? `${item.percent}%`}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>Ainda sem dados.</p>
            )}
          </section>
        ))}
      </div>
      {trainer ? (
        <p className="nt-detail-note">
          Treinos ativos:{' '}
          <strong>{data.stats?.active_workouts?.value ?? 0}</strong>
        </p>
      ) : (
        <p className="nt-detail-note">
          Metas em andamento: <strong>{data.stats?.goals?.value ?? 0}</strong>
        </p>
      )}
    </details>
  )
}
