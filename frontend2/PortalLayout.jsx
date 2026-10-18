import React, { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ErrorBoundary from './ErrorBoundary'
import { preferenceStorageAllowed } from './cookiePreferences'

const readStoredBoolean = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  if (!preferenceStorageAllowed()) return fallback
  const value = window.localStorage.getItem(key)
  if (value === null) return fallback
  return value === 'true'
}

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const stored = preferenceStorageAllowed() ? window.localStorage.getItem('chemhub-theme') : null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function PortalLayout({ children, title, subtitle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    readStoredBoolean('chemhub-sidebar-collapsed', false)
  )
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.classList.toggle('dark', theme === 'dark')
    if (preferenceStorageAllowed()) window.localStorage.setItem('chemhub-theme', theme)
  }, [theme])

  useEffect(() => {
    if (preferenceStorageAllowed()) window.localStorage.setItem('chemhub-sidebar-collapsed', String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  useEffect(() => {
    const applyPreferences = (event) => {
      if (!event.detail?.functional) return
      window.localStorage.setItem('chemhub-theme', theme)
      window.localStorage.setItem('chemhub-sidebar-collapsed', String(isSidebarCollapsed))
    }
    window.addEventListener('chemhub:cookie-preferences-changed', applyPreferences)
    return () => window.removeEventListener('chemhub:cookie-preferences-changed', applyPreferences)
  }, [theme, isSidebarCollapsed])

  useEffect(() => {
    document.title = `${title} | Chemistry Hub`
  }, [title])

  const isDarkMode = theme === 'dark'
  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col lg:flex-row font-sans text-[var(--foreground)] transition-colors duration-200">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
      />

      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-[margin] duration-200 ease-in-out ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Topbar
          title={title}
          subtitle={subtitle}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl w-full mx-auto">
          <ErrorBoundary
            fallback={(error, retry) => (
              <div className="py-12 text-center max-w-md mx-auto bg-surface border border-border rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[var(--destructive-soft)] text-destructive grid place-items-center mx-auto mb-3 font-bold">
                  <AlertCircle size={22} />
                </div>
                <h2 className="text-base font-bold text-foreground">Something went wrong</h2>
                <p className="text-xs text-muted-foreground mt-1">Chemistry Hub could not display this section.</p>
                {import.meta.env.DEV && error && (
                  <div className="mt-3 p-3 bg-red-50 text-red-700 text-[11px] text-left font-mono rounded-lg overflow-auto max-h-40">
                    {error.message || String(error)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-xs"
                >
                  Try again
                </button>
              </div>
            )}
          >
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
