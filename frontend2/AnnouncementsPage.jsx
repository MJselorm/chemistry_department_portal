import React from 'react'
import { MOCK_ANNOUNCEMENTS } from './mocks'

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7d9297]">DEPARTMENT UPDATES</span>
        <h1 className="text-2xl font-bold text-[#102a2f] mt-1">Announcements</h1>
        <p className="text-xs text-[#64777d] mt-1">Latest notices and directives from the chemistry department.</p>
      </div>

      {/* Announcement List */}
      <div className="space-y-4">
        {MOCK_ANNOUNCEMENTS.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-[#e4ecee] rounded-2xl p-6 shadow-sm hover:border-[#b8dfe1] transition-colors"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  item.badgeColor === 'red'
                    ? 'bg-[#fdecec] text-[#c84b4b]'
                    : item.badgeColor === 'blue'
                    ? 'bg-[#e7f5f7] text-[#087f8c]'
                    : 'bg-[#e7f5ed] text-[#27805a]'
                }`}
              >
                {item.category}
              </span>
              <small className="text-[11px] text-[#9aa7aa] font-medium">{item.timeAgo}</small>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#102a2f] mb-2">{item.title}</h2>
            <p className="text-xs text-[#64777d] leading-relaxed mb-4">{item.body}</p>
            <div className="flex items-center gap-2 text-[10px] text-[#9aa7aa] border-t border-[#f4f7f8] pt-3">
              <span>Department Official Notice</span>
              <span>•</span>
              <span>Chemistry Board of Studies</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
