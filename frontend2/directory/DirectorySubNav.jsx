import React from 'react'
import { NavLink } from 'react-router-dom'

const DIRECTORY_LINKS = [
  { to: '/admin/directory', label: 'Overview', icon: '◫' },
  { to: '/admin/directory/executives', label: 'Executives', icon: '👥' },
  { to: '/admin/directory/class-representatives', label: 'Class Reps', icon: '👤' },
  { to: '/admin/directory/lecturers', label: 'Lecturers', icon: '🎓' },
  { to: '/admin/directory/courses', label: 'Courses', icon: '📖' },
  { to: '/admin/directory/clubs', label: 'Clubs', icon: '🧭' },
  { to: '/admin/directory/committees', label: 'Committees', icon: '🛡' },
  { to: '/admin/directory/departments', label: 'Departments', icon: '🏛' },
  { to: '/admin/directory/contacts', label: 'Contacts', icon: '📞' },
]

export default function DirectorySubNav() {
  return (
    <div className="bg-white border border-[#e4ecee] rounded-2xl p-1.5 shadow-xs overflow-x-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-1 min-w-max">
        {DIRECTORY_LINKS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin/directory'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#102a2f] text-white shadow-xs'
                  : 'text-[#65767b] hover:text-[#087f8c] hover:bg-[#f1f7f7]'
              }`
            }
          >
            <span className="text-xs">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
