import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import PortalLayout from './PortalLayout'

import { ToastProvider } from './directory/Toast'

const LoginPage = lazy(() => import('./LoginPage'))
const DashboardPage = lazy(() => import('./DashboardPage'))
const EventsPage = lazy(() => import('./EventsPage'))
const AcademicHubPage = lazy(() => import('./AcademicHubPage'))
const DirectoryPage = lazy(() => import('./DirectoryPage'))
const AnnouncementsPage = lazy(() => import('./AnnouncementsPage'))
const ProfilePage = lazy(() => import('./ProfilePage'))
const SettingsPage = lazy(() => import('./SettingsPage'))
const AdminPage = lazy(() => import('./AdminPage'))
const DirectoryAdminOverview = lazy(() => import('./directory/DirectoryAdminOverview'))
const DirectoryEntityManager = lazy(() => import('./directory/DirectoryEntityManager'))

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center" role="status">
      <div>
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">Loading Chemistry Hub…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<RouteLoading />}>
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
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
