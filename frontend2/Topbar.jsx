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
    <header className="min-h-16 bg-[var(--header)] backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 lg:px-8 sticky top-0 z-30 transition-colors duration-200">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <strong className="block max-w-[84px] truncate text-sm font-semibold leading-none text-[var(--foreground)] min-[390px]:max-w-[130px] sm:max-w-none sm:text-base">
              {displayTitle}
            </strong>
            <span
              className={`hidden sm:inline-flex px-2 py-0.5 text-[9px] font-black uppercase rounded-full tracking-wider ${
                isAdmin
                  ? 'bg-[var(--accent-soft)] text-[var(--warning)] border border-[var(--warning-border)]'
                  : 'bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-border)]'
              }`}
            >
              {isAdmin ? 'Admin' : 'Student'}
            </span>
          </div>
          <small className="hidden min-[430px]:block text-[10px] sm:text-[11px] text-[var(--muted-foreground)] mt-0.5 truncate">
            {displaySubtitle}
          </small>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg border border-[var(--border)] grid place-items-center text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>

        <button
          onClick={() => alert('Portal notifications are not available yet.')}
          className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg border border-[var(--border)] grid place-items-center text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          aria-label="Open notifications"
          title="Notifications"
        >
          <Bell size={16} aria-hidden="true" />
        </button>

        {/* User profile chip */}
        <Link
          to="/profile"
          className="flex h-10 items-center gap-2.5 px-1 sm:h-auto sm:px-2.5 sm:py-1 rounded-lg hover:bg-[var(--muted)] border border-transparent hover:border-[var(--border)] transition-all"
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
