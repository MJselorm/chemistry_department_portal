import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function Topbar({ title, subtitle, onOpenSidebar }) {
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
    <header className="h-16 bg-white/95 backdrop-blur border-b border-[#e4ecee] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-[#728388] hover:bg-gray-100 transition-colors"
          aria-label="Open navigation menu"
        >
          ☰
        </button>
        <div>
          <div className="flex items-center gap-2">
            <strong className="block text-sm sm:text-base font-bold text-[#102a2f] leading-none">
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
          <small className="block text-[10px] sm:text-[11px] text-[#93a1a5] mt-0.5">
            {displaySubtitle}
          </small>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Placeholder: Notifications */}
        <button
          onClick={() => alert('Notifications (Placeholder API: /notifications)')}
          className="w-8 h-8 rounded-xl border border-[#e4ecee] grid place-items-center text-[#728388] hover:bg-gray-50 text-sm transition-colors"
          title="Notifications"
        >
          ♧
        </button>

        {/* User profile chip */}
        <Link
          to="/profile"
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-[#f1f7f7] border border-transparent hover:border-[#e4ecee] transition-all"
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
          <span className="hidden sm:block text-xs font-bold text-[#102a2f] max-w-[140px] truncate">
            {displayName}
          </span>
        </Link>
      </div>
    </header>
  )
}
