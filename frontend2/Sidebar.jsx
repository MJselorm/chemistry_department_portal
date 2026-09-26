import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from './AuthContext'

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'

  const navLinks = [
    {
      to: '/dashboard',
      label: isAdmin ? 'Admin Dashboard' : 'Student Dashboard',
      icon: isAdmin ? ShieldCheck : LayoutDashboard,
    },
    { to: '/events', label: 'Events', icon: CalendarDays },
    { to: '/academic', label: 'Academic Hub', icon: GraduationCap },
    {
      to: isAdmin ? '/admin/directory' : '/directory',
      label: 'Directory',
      icon: Users,
    },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/profile', label: 'My Profile', icon: User },
  ]

  const handleSignOut = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col z-50 transition-[transform,width] duration-200 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`flex items-center gap-3 border-b border-[var(--sidebar-border)] px-4 py-4 ${isCollapsed ? 'lg:justify-center' : ''}`}>
          <img
            src="/gscs-logo-circle.png"
            alt="GSCS"
            className="w-10 h-10 rounded-full object-contain flex-shrink-0 ring-1 ring-[var(--border)] bg-surface"
          />
          <div className={isCollapsed ? 'lg:hidden' : ''}>
            <strong className="block text-sm font-bold text-[var(--sidebar-foreground)] leading-none">Chemistry Hub</strong>
            <span className="block text-[10px] text-[var(--muted-foreground)] mt-1">
              {isAdmin ? 'Admin Console' : 'Department Portal'}
            </span>
          </div>
        </div>

        <div className="hidden lg:flex px-3 py-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={`w-full flex items-center rounded-lg px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--primary)] transition-colors ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            <span className={isCollapsed ? 'lg:hidden' : ''}>
              {isCollapsed ? 'Expand' : 'Collapse'}
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 flex-1 overflow-y-auto space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon
            const isDirectoryActive =
              item.label === 'Directory' &&
              (location.pathname.startsWith('/admin/directory') || location.pathname === '/directory')

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isCollapsed ? 'lg:justify-center' : ''
                  } ${
                    isActive || isDirectoryActive
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-bold before:absolute before:left-0 before:h-5 before:w-0.5 before:rounded-full before:bg-[var(--accent)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]'
                  }`
                }
              >
                <Icon size={17} className="w-5 flex-shrink-0" strokeWidth={2.2} aria-hidden="true" />
                <span className={isCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
                {item.to === '/dashboard' && (
                  <span
                    className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                      isCollapsed ? 'lg:hidden' : ''
                    } ${
                      'bg-[var(--accent-soft)] text-[var(--accent)]'
                    }`}
                  >
                    {isAdmin ? 'Admin' : 'Student'}
                  </span>
                )}
                {isCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--tooltip)] px-2 py-1 text-[11px] font-bold text-[var(--tooltip-foreground)] shadow-card group-hover:lg:block">
                    {item.label}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[var(--sidebar-border)] space-y-1 bg-[var(--sidebar-muted)]">
          <NavLink
            to="/settings"
            onClick={onClose}
            title={isCollapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isCollapsed ? 'lg:justify-center' : ''
              } ${
                isActive
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)] before:absolute before:left-0 before:h-5 before:w-0.5 before:rounded-full before:bg-[var(--accent)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]'
              }`
            }
          >
            <Settings size={17} className="w-5 flex-shrink-0" aria-hidden="true" />
            <span className={isCollapsed ? 'lg:hidden' : ''}>Settings</span>
            {isCollapsed && (
              <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--tooltip)] px-2 py-1 text-[11px] font-bold text-[var(--tooltip-foreground)] shadow-card group-hover:lg:block">
                Settings
              </span>
            )}
          </NavLink>

          <button
            onClick={handleSignOut}
            className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--destructive)] hover:bg-[var(--destructive-soft)] transition-colors text-left ${
              isCollapsed ? 'lg:justify-center' : ''
            }`}
            title={isCollapsed ? 'Sign out' : undefined}
          >
            <LogOut size={17} className="w-5 flex-shrink-0" aria-hidden="true" />
            <span className={isCollapsed ? 'lg:hidden' : ''}>Sign out</span>
            {isCollapsed && (
              <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--tooltip)] px-2 py-1 text-[11px] font-bold text-[var(--tooltip-foreground)] shadow-card group-hover:lg:block">
                Sign out
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
