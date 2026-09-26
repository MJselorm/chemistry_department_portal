import React from 'react'
import { Link } from 'react-router-dom'
import { Bell, Menu, Moon, Sun } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function Topbar({ title, subtitle, onOpenSidebar, isDarkMode, onToggleTheme }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  // Dynamically designate Student vs Admin on dashboard
  const displayTitle = title === 'Dashboard'
    ? (isAdmin ? 'Admin Dashboard' : 'Student Dashboard')
    : title

  const displaySubtitle = subtitle || (
    isAdmin ? 'Administrator Console' : 'Student Portal · Chemistry Department'
  )

  const displayName = user?.full_name || (user?.email ? user.email.split('@')[0] : (isAdmin ? 'Administrator' : 'Student'))
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || (isAdmin ? 'AD' : 'ST')

  return (
    <header className="min-h-16 bg-[var(--header)] backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8 sticky top-0 z-30 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <strong className="block text-sm sm:text-base font-semibold text-[var(--foreground)] leading-none">
              {displayTitle}
            </strong>
            <span
              className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full tracking-wider ${
                isAdmin
                  ? 'bg-[var(--accent-soft)] text-[var(--warning)] border border-[var(--warning-border)]'
                  : 'bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-border)]'
              }`}
            >
              {isAdmin ? 'Admin' : 'Student'}
            </span>
          </div>
          <small className="block text-[10px] sm:text-[11px] text-[var(--muted-foreground)] mt-0.5">
            {displaySubtitle}
          </small>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-lg border border-[var(--border)] grid place-items-center text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>

        <button
          onClick={() => alert('Notifications (Placeholder API: /notifications)')}
          className="w-9 h-9 rounded-lg border border-[var(--border)] grid place-items-center text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          aria-label="Open notifications"
          title="Notifications"
        >
          <Bell size={16} aria-hidden="true" />
        </button>

        {/* User profile chip */}
        <Link
          to="/profile"
          className="flex items-center gap-2.5 px-1.5 sm:px-2.5 py-1 rounded-lg hover:bg-[var(--muted)] border border-transparent hover:border-[var(--border)] transition-all"
        >
          <span
            className={`w-8 h-8 rounded-full font-extrabold text-xs grid place-items-center ${
              isAdmin
                ? 'bg-[var(--accent-soft)] text-[var(--warning)]'
                : 'bg-[var(--primary-soft)] text-[var(--primary)]'
            }`}
          >
            {initials}
          </span>
          <span className="hidden sm:block text-xs font-bold text-[var(--foreground)] max-w-[140px] truncate">
            {displayName}
          </span>
        </Link>
      </div>
    </header>
  )
}
