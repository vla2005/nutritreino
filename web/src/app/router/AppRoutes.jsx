import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RouteFallback from '@/shared/components/ui/RouteFallback/RouteFallback.jsx'
import AuthenticatedOutlet from './AuthenticatedOutlet.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import '@/features/auth/components/AuthLayout/AuthResponsive.css'

const AppShell = lazy(() => import('@/layouts/AppShell/AppShell.jsx'))
const AcceptInvitePage = lazy(() => import('@/pages/invitations/AcceptInvitePage/AcceptInvitePage.jsx'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage/LoginPage.jsx'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage/RegisterPage.jsx'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage/VerifyEmailPage.jsx'))
const DashboardHomePage = lazy(() => import('@/pages/home/DashboardHomePage/DashboardHomePage.jsx'))
const ClientProfilePage = lazy(() => import('@/pages/patients/ClientProfilePage/ClientProfilePage.jsx'))
const PatientsPage = lazy(() => import('@/pages/patients/PatientsPage/PatientsPage.jsx'))
const MealPlansPage = lazy(() => import('@/pages/nutrition/MealPlansPage/MealPlansPage.jsx'))
const NutritionPlanPage = lazy(() => import('@/pages/nutrition/NutritionPlanPage/NutritionPlanPage.jsx'))
const MessagesPage = lazy(() => import('@/pages/messages/MessagesPage/MessagesPage.jsx'))
const ProfessionalProfilePage = lazy(() => import('@/pages/professionals/ProfessionalProfilePage/ProfessionalProfilePage.jsx'))
const ClientProgressPage = lazy(() => import('@/pages/progress/ClientProgressPage/ClientProgressPage.jsx'))
const ProfileSettingsPage = lazy(() => import('@/pages/settings/ProfileSettingsPage/ProfileSettingsPage.jsx'))
const WorkoutPlanPage = lazy(() => import('@/pages/workouts/WorkoutPlanPage/WorkoutPlanPage.jsx'))
const WorkoutProgramsPage = lazy(() => import('@/pages/workouts/WorkoutProgramsPage/WorkoutProgramsPage.jsx'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
            <Route path="messages" element={<MessagesPage />} />
            <Route path="progress" element={<ClientProgressPage />} />
            <Route path="settings" element={<ProfileSettingsPage />} />
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
    </Suspense>
  )
}
