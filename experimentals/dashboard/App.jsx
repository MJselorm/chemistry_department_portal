import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AcademicHubPage from './pages/AcademicHubPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hub"
            element={
              <ProtectedRoute>
                <AcademicHubPage />
              </ProtectedRoute>
            }
          />
          {/* Sidebar destinations — point these at real pages as you build them. */}
          <Route path="*" element={<Navigate to="/hub" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
