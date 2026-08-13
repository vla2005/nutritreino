import { useAuth } from '@/composables/useAuth.js'
import ClientProgress from '@/pages/dashboard/ClientProgress.jsx'
import NutritionistDashboard from './components/NutritionistDashboard.jsx'
import TrainerDashboard from './components/TrainerDashboard.jsx'
import './DashboardHomePage.css'

export default function DashboardHomePage() {
  const { role, user } = useAuth()
  const speciality = user?.professional?.speciality
  const effectiveRole = speciality || role

  if (effectiveRole === 'trainer') return <TrainerDashboard />
  if (effectiveRole === 'client') return <ClientProgress />

  return <NutritionistDashboard />
}
