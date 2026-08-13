import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import AcceptInvite from './pages/AcceptInvite.jsx'
import LoginPage from '@/pages/auth/LoginPage/LoginPage.jsx'
import RegisterPage from '@/pages/auth/RegisterPage/RegisterPage.jsx'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage/VerifyEmailPage.jsx'
import DashboardHome from './pages/dashboard/DashboardHome.jsx'
import ClientProfile from './pages/dashboard/ClientProfile.jsx'
import MainDashboard from './pages/dashboard/MainDashboard.jsx'
import MealPlans from './pages/dashboard/MealPlans.jsx'
import Messages from './pages/dashboard/Messages.jsx'
import NutritionPlanForm from './pages/dashboard/NutritionPlanForm.jsx'
import ProfessionalProfile from './pages/dashboard/ProfessionalProfile.jsx'
import ClientProgress from './pages/dashboard/ClientProgress.jsx'
import ProfileSettings from './pages/dashboard/ProfileSettings.jsx'
import WorkoutPlanForm from './pages/dashboard/WorkoutPlanForm.jsx'
import WorkoutPrograms from './pages/dashboard/WorkoutPrograms.jsx'
import Patients from './pages/patients/Patients.jsx'

const TOKEN_KEY = 'auth_token'

function ProtectedRoute({ children }) {
  const location = useLocation()

  if (!localStorage.getItem(TOKEN_KEY)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/patients" element={<Patients />} />
        <Route path="/dashboard" element={<MainDashboard />}>
          <Route index element={<Navigate to="/dashboard/home" replace />} />
          <Route path="home" element={<DashboardHome />} />
          <Route path="clients/:uuid" element={<ClientProfile />} />
          <Route path="meal-plans" element={<MealPlans />} />
          <Route path="messages" element={<Messages />} />
          <Route path="progress" element={<ClientProgress />} />
          <Route path="settings" element={<ProfileSettings />} />
          <Route path="plans" element={<NutritionPlanForm />} />
          <Route path="plans/:uuid" element={<NutritionPlanForm />} />
          <Route path="professionals/:uuid" element={<ProfessionalProfile />} />
          <Route path="workouts" element={<WorkoutPrograms />} />
          <Route path="workouts/new" element={<WorkoutPlanForm />} />
          <Route path="workouts/:uuid" element={<WorkoutPlanForm />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
