import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '@/layouts/AppShell/AppShell.jsx'
import AcceptInvitePage from '@/pages/invitations/AcceptInvitePage/AcceptInvitePage.jsx'
import LoginPage from '@/pages/auth/LoginPage/LoginPage.jsx'
import RegisterPage from '@/pages/auth/RegisterPage/RegisterPage.jsx'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage/VerifyEmailPage.jsx'
import DashboardHomePage from '@/pages/home/DashboardHomePage/DashboardHomePage.jsx'
import ClientProfilePage from '@/pages/patients/ClientProfilePage/ClientProfilePage.jsx'
import MealPlansPage from '@/pages/nutrition/MealPlansPage/MealPlansPage.jsx'
import Messages from '@/pages/dashboard/Messages.jsx'
import NutritionPlanPage from '@/pages/nutrition/NutritionPlanPage/NutritionPlanPage.jsx'
import ProfessionalProfilePage from '@/pages/professionals/ProfessionalProfilePage/ProfessionalProfilePage.jsx'
import ClientProgress from '@/pages/dashboard/ClientProgress.jsx'
import ProfileSettings from '@/pages/dashboard/ProfileSettings.jsx'
import WorkoutPlanPage from '@/pages/workouts/WorkoutPlanPage/WorkoutPlanPage.jsx'
import WorkoutProgramsPage from '@/pages/workouts/WorkoutProgramsPage/WorkoutProgramsPage.jsx'
import PatientsPage from '@/pages/patients/PatientsPage/PatientsPage.jsx'
import AuthenticatedOutlet from './AuthenticatedOutlet.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import '@/features/auth/components/AuthLayout/AuthResponsive.css'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/dashboard" element={<AuthenticatedOutlet />}>
            <Route index element={<Navigate to="/dashboard/home" replace />} />
            <Route path="home" element={<DashboardHomePage />} />
            <Route path="clients/:uuid" element={<ClientProfilePage />} />
            <Route path="meal-plans" element={<MealPlansPage />} />
            <Route path="messages" element={<Messages />} />
            <Route path="progress" element={<ClientProgress />} />
            <Route path="settings" element={<ProfileSettings />} />
            <Route path="plans" element={<NutritionPlanPage />} />
            <Route path="plans/:uuid" element={<NutritionPlanPage />} />
            <Route path="professionals/:uuid" element={<ProfessionalProfilePage />} />
            <Route path="workouts" element={<WorkoutProgramsPage />} />
            <Route path="workouts/new" element={<WorkoutPlanPage />} />
            <Route path="workouts/:uuid" element={<WorkoutPlanPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
