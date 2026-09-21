import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from './LoginPage'
import PortalLayout from './PortalLayout'

// Converted Chemistry Hub Pages
import DashboardPage from './DashboardPage'
import EventsPage from './EventsPage'
import AcademicHubPage from './AcademicHubPage'
import DirectoryPage from './DirectoryPage'
import AnnouncementsPage from './AnnouncementsPage'
import ProfilePage from './ProfilePage'
import SettingsPage from './SettingsPage'
import AdminPage from './AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing / Sign In Page (Preserved) */}
          <Route path="/" element={<LoginPage />} />

          {/* Authenticated Department Portal Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PortalLayout title="Dashboard" subtitle="Chemistry Department">
                  <DashboardPage />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <PortalLayout title="Events" subtitle="Department Calendar">
                  <EventsPage />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/academic"
            element={
              <ProtectedRoute>
                <PortalLayout title="Academic Hub" subtitle="Study Centre">
                  <AcademicHubPage />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/directory"
            element={
              <ProtectedRoute>
                <PortalLayout title="Directory" subtitle="Department Directory">
                  <DirectoryPage />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <PortalLayout title="Announcements" subtitle="Department Updates">
                  <AnnouncementsPage />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PortalLayout title="My Profile" subtitle="Account Details">
                  <ProfilePage />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <PortalLayout title="Settings" subtitle="Preferences">
                  <SettingsPage />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <PortalLayout title="Admin Dashboard" subtitle="Administration Console">
                  <AdminPage />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
