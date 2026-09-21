import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const navLinks = [
    {
      to: '/dashboard',
      label: isAdmin ? 'Admin Dashboard' : 'Student Dashboard',
      icon: isAdmin ? '◆' : '⌂',
      highlight: isAdmin ? 'text-[#7652b8]' : 'text-[#087f8c]',
    },
    { to: '/events', label: 'Events', icon: '◷' },
    { to: '/academic', label: 'Academic Hub', icon: '▣' },
    { to: '/directory', label: 'Directory', icon: '◎' },
    { to: '/announcements', label: 'Announcements', icon: '▤' },
    { to: '/profile', label: 'My Profile', icon: '◌' },
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
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-[#e4ecee] flex flex-col z-50 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e4ecee]">
          <div className="w-9 h-9 rounded-xl bg-[#102a2f] text-white font-black text-xs grid place-items-center tracking-wider shadow-sm">
            CH
          </div>
          <div>
            <strong className="block text-sm font-bold text-[#102a2f] leading-none">Chemistry Hub</strong>
            <span className="block text-[10px] text-[#91a0a5] mt-1">
              {isAdmin ? 'Admin Console' : 'Department Portal'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 flex-1 overflow-y-auto space-y-1">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? isAdmin && item.to === '/dashboard'
                      ? 'bg-[#f0eafb] text-[#7652b8] font-bold shadow-xs'
                      : 'bg-[#e8f6f7] text-[#087f8c] font-bold shadow-xs'
                    : 'text-[#65767b] hover:bg-[#f1f7f7] hover:text-[#087f8c]'
                }`
              }
            >
              <span className="w-5 text-center text-sm opacity-80">{item.icon}</span>
              <span>{item.label}</span>
              {item.to === '/dashboard' && (
                <span
                  className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                    isAdmin
                      ? 'bg-[#eee7fa] text-[#7652b8]'
                      : 'bg-[#e8f6f7] text-[#087f8c]'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'Student'}
                </span>
              )}
            </NavLink>
          ))}


        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#e4ecee] space-y-1 bg-[#fbfdfd]">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#e8f6f7] text-[#087f8c]'
                  : 'text-[#65767b] hover:bg-[#f1f7f7]'
              }`
            }
          >
            <span className="w-5 text-center text-sm opacity-80">⚙</span>
            <span>Settings</span>
          </NavLink>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#b64a4a] hover:bg-[#fdecec] transition-colors text-left"
          >
            <span className="w-5 text-center text-sm opacity-80">↪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
