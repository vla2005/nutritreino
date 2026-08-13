import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/composables/useAuth.js'

export default function AuthenticatedOutlet() {
  const { user, loading, error } = useAuth()
  const location = useLocation()
  const isAuthError = error?.toLowerCase().includes('autenticado')

  if (loading) return <RouteLoadingState />

  if (isAuthError) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (error) return <RouteErrorState error={error} />
  if (!user) return null

  return <Outlet />
}

function RouteLoadingState() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-4">
      <svg className="spin h-9 w-9 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  )
}

function RouteErrorState({ error }) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-4">
      <p className="text-sm text-red-500">{error}</p>
      <Link to="/login" className="text-sm text-blue-500 hover:underline">Voltar ao login</Link>
    </div>
  )
}
