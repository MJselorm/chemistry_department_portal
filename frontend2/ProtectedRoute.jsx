import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, booting } = useAuth()
  const location = useLocation()

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-slate-400">
        Checking your session…
      </div>
    )
  }
  if (!user) return <Navigate to="/" replace state={{ from: location }} />
  return children
}
