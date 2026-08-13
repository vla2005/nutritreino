import { Navigate, Outlet, useLocation } from 'react-router-dom'

const TOKEN_KEY = 'auth_token'

export default function ProtectedRoute() {
  const location = useLocation()

  if (!localStorage.getItem(TOKEN_KEY)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
