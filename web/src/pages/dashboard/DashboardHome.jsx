import { useAuth } from '../../composables/useAuth.js'
import ClientProgress from './ClientProgress.jsx'
import NutritionistHome from './NutritionistHome.jsx'
import TrainerHome from './TrainerHome.jsx'

export default function DashboardHome() {
  const { role, user } = useAuth()
  const speciality = user?.professional?.speciality
  const effectiveRole = speciality || role

  if (effectiveRole === 'trainer') return <TrainerHome />
  if (effectiveRole === 'client') return <ClientProgress />

  return <NutritionistHome />
}
