import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, booting } = useAuth()
  const location = useLocation()

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center" role="status">
        <div>
          <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Checking your session…</p>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/" replace state={{ from: location }} />
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
