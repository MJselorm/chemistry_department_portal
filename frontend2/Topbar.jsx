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
    <header className="h-16 bg-[var(--header)]/95 backdrop-blur border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 transition-colors duration-200">
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
            <strong className="block text-sm sm:text-base font-bold text-[var(--foreground)] leading-none">
              {displayTitle}
            </strong>
            <span
              className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full tracking-wider ${
                isAdmin
                  ? 'bg-[#eee7fa] text-[#7652b8] border border-[#d6c3f3]'
                  : 'bg-[#e8f6f7] text-[#087f8c] border border-[#bce4e8]'
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-xl border border-[var(--border)] grid place-items-center text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>

        <button
          onClick={() => alert('Notifications (Placeholder API: /notifications)')}
          className="w-8 h-8 rounded-xl border border-[var(--border)] grid place-items-center text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          aria-label="Open notifications"
          title="Notifications"
        >
          <Bell size={16} aria-hidden="true" />
        </button>

        {/* User profile chip */}
        <Link
          to="/profile"
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-[var(--muted)] border border-transparent hover:border-[var(--border)] transition-all"
        >
          <span
            className={`w-8 h-8 rounded-full font-extrabold text-xs grid place-items-center ${
              isAdmin
                ? 'bg-[#eee7fa] text-[#7652b8]'
                : 'bg-[#d8f0f1] text-[#087f8c]'
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
