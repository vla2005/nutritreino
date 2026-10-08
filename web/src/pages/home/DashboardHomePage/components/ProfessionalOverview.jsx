import { useState } from 'react'
import { ArrowClockwiseIcon } from '@phosphor-icons/react'
import { useAuth } from '@/composables/useAuth.js'
import TrendChart from '@/shared/components/charts/TrendChart/TrendChart.jsx'
import { dateTimestamp } from '@/shared/components/charts/TrendChart/trendData.js'
import DashboardBreakdown, { DashboardDetails } from './DashboardBreakdown.jsx'
import { AttentionPatients, LatestCheckIns } from './DashboardPeople.jsx'

export default function ProfessionalOverview({
  data,
  loading,
  error,
  trainer = false,
  action,
  onRetry,
}) {
  const { fullName, user } = useAuth()
  const [period, setPeriod] = useState('30')
  const name = data?.greeting?.name || fullName || user?.name || 'Profissional'
  const firstName = name
    .replace(/^(Dra?\.?|Prof\.?)\s+/i, '')
    .trim()
    .split(/\s+/)[0]
  const date = data?.greeting?.date
    ? new Date(`${data.greeting.date}T12:00:00`)
    : new Date()
  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const points = (data?.adherence_history || []).filter((point) => {
    const age = (date.getTime() - dateTimestamp(point.date)) / 86400000
    return age >= 0 && age <= Number(period)
  })
  const stats = data?.stats
  const adherenceTotal = (data?.adherence?.items || []).reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  )
  const metrics = [
    {
      label: trainer ? 'alunos ativos' : 'pacientes ativos',
      ...stats?.active_clients,
    },
    {
      label: trainer ? 'programas de treino' : 'planos alimentares',
      ...(trainer ? stats?.workout_programs : stats?.meal_plans),
    },
    {
      label: 'check-ins nesta semana',
      value: stats?.weekly_checkins?.value,
      detail: 'Registros recebidos nesta semana',
    },
    {
      label: trainer ? 'adesão média aos treinos' : 'adesão média à dieta',
      value: adherenceTotal ? `${data?.adherence?.average ?? 0}%` : '—',
      detail: adherenceTotal
        ? 'Nos check-ins com adesão informada'
        : 'Aguardando o primeiro check-in',
    },
  ]
  return (
    <div className="nt-overview" aria-busy={loading}>
      <header className="nt-overview-header">
        <div>
          <h1>Olá, {firstName}</h1>
          <p>
            {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
          </p>
        </div>
        {action}
      </header>
      {!data && !loading ? (
        <section className="nt-panel nt-overview-error" role="alert">
          <h2>Não foi possível carregar seu painel</h2>
          <p>{error || 'Tente atualizar para continuar.'}</p>
          <button className="nt-secondary-button" onClick={onRetry}>
            <ArrowClockwiseIcon size={18} /> Tentar novamente
          </button>
        </section>
      ) : (
        <>
          <section className="nt-metrics" aria-label="Resumo do acompanhamento">
            {metrics.map((metric) => (
              <article className="nt-metric" key={metric.label}>
                {loading && !data ? (
                  <>
                    <span className="nt-skeleton is-value" />
                    <span className="nt-skeleton" />
                    <span className="nt-skeleton is-short" />
                  </>
                ) : (
                  <>
                    <strong>{metric.value ?? 0}</strong>
                    <h2>{metric.label}</h2>
                    <p>{metric.detail}</p>
                  </>
                )}
              </article>
            ))}
          </section>
          {loading && !data ? (
            <div
              className="nt-overview-grid nt-dashboard-skeleton"
              aria-label="Carregando seu acompanhamento"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <div className="nt-panel" key={index}>
                  <span className="nt-skeleton" />
                  <span className="nt-skeleton is-chart" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {error ? (
                <p className="nt-refresh-error" role="status">
                  {error} <button onClick={onRetry}>Tentar novamente</button>
                </p>
              ) : null}
              <div className="nt-overview-grid">
                <section className="nt-panel nt-adherence-panel">
                  <header className="nt-panel-head nt-chart-head">
                    <div>
                      <h2>
                        Evolução da adesão {trainer ? 'ao treino' : 'à dieta'}
                      </h2>
                      <p>Últimos {period} dias</p>
                    </div>
                    <label>
                      <span className="nt-sr-only">Período do gráfico</span>
                      <select
                        value={period}
                        onChange={(event) => setPeriod(event.target.value)}
                      >
                        <option value="30">Últimos 30 dias</option>
                        <option value="14">Últimos 14 dias</option>
                        <option value="7">Últimos 7 dias</option>
                      </select>
                    </label>
                  </header>
                  <TrendChart
                    points={points}
                    title={`Adesão ${trainer ? 'ao treino' : 'à dieta'}`}
                    tickValues={[0, 25, 50, 75, 100]}
                  />
                </section>
                <AttentionPatients
                  items={
                    trainer ? data.attention_students : data.attention_clients
                  }
                  trainer={trainer}
                />
                <LatestCheckIns
                  items={data.latest_checkins}
                  trainer={trainer}
                />
                <DashboardBreakdown
                  items={data.adherence?.items}
                  title="Distribuição da adesão"
                />
              </div>
              <DashboardDetails data={data} trainer={trainer} />
            </>
          )}
        </>
      )}
    </div>
  )
}
