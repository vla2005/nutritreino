import { PlusIcon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { getTrainerDashboard } from '@/services/dashboard.js'
import { useProfessionalDashboard } from '../hooks/useProfessionalDashboard.js'
import ProfessionalOverview from './ProfessionalOverview.jsx'

export default function TrainerDashboard() {
  const { dashboard, loading, error, refresh } =
    useProfessionalDashboard(getTrainerDashboard)
  return (
    <ProfessionalOverview
      data={dashboard}
      loading={loading}
      error={error}
      trainer
      onRetry={() => refresh().catch(() => {})}
      action={
        <Link className="nt-primary-button" to="/dashboard/workouts/new">
          <PlusIcon size={20} /> Novo treino
        </Link>
      }
    />
  )
}
