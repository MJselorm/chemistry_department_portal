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

// Student Directory Admin Suite
import { ToastProvider } from './directory/Toast'
import DirectoryAdminOverview from './directory/DirectoryAdminOverview'
import DirectoryEntityManager from './directory/DirectoryEntityManager'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
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
              <ProtectedRoute adminOnly>
                <PortalLayout title="Admin Dashboard" subtitle="Administration Console">
                  <AdminPage />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          {/* Student Directory Admin Suite */}
          <Route
            path="/admin/directory"
            element={
              <ProtectedRoute adminOnly>
                <PortalLayout title="Directory Management" subtitle="Admin Console">
                  <DirectoryAdminOverview />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/directory/executives"
            element={
              <ProtectedRoute adminOnly>
                <PortalLayout title="Executives" subtitle="Directory Administration">
                  <DirectoryEntityManager categoryKey="executives" />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/directory/class-representatives"
            element={
              <ProtectedRoute adminOnly>
                <PortalLayout title="Class Representatives" subtitle="Directory Administration">
                  <DirectoryEntityManager categoryKey="classRepresentatives" />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/directory/course-representatives"
            element={<Navigate to="/admin/directory/class-representatives" replace />}
          />

          <Route
            path="/admin/directory/lecturers"
            element={
              <ProtectedRoute adminOnly>
                <PortalLayout title="Lecturers" subtitle="Directory Administration">
                  <DirectoryEntityManager categoryKey="lecturers" />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/directory/courses"
            element={
              <ProtectedRoute adminOnly>
                <PortalLayout title="Courses" subtitle="Directory Administration">
                  <DirectoryEntityManager categoryKey="courses" />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/directory/clubs"
            element={
              <ProtectedRoute adminOnly>
                <PortalLayout title="Clubs" subtitle="Directory Administration">
                  <DirectoryEntityManager categoryKey="clubs" />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/directory/committees"
            element={
              <ProtectedRoute adminOnly>
                <PortalLayout title="Committees" subtitle="Directory Administration">
                  <DirectoryEntityManager categoryKey="committees" />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/directory/departments"
            element={
              <ProtectedRoute adminOnly>
                <PortalLayout title="Departments" subtitle="Directory Administration">
                  <DirectoryEntityManager categoryKey="departments" />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/directory/contacts"
            element={
              <ProtectedRoute adminOnly>
                <PortalLayout title="Directory Contacts" subtitle="Directory Administration">
                  <DirectoryEntityManager categoryKey="contacts" />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
