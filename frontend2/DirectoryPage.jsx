import React, { useState } from 'react'
import { MOCK_DIRECTORY_PEOPLE } from './mocks'

export default function DirectoryPage() {
  const [activeTab, setActiveTab] = useState('GSCS Executives')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = ['GSCS Executives', 'Class Representatives', 'Lecturers']

  const filteredPeople = MOCK_DIRECTORY_PEOPLE.filter((p) => {
    const matchesTab = p.category === activeTab
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.level.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7d9297]">PEOPLE</span>
          <h1 className="text-2xl font-bold text-[#102a2f] mt-1">Department Directory</h1>
          <p className="text-xs text-[#64777d] mt-1">Find executives, class representatives and lecturers.</p>
        </div>
        <div className="w-full sm:w-64 relative">
          <span className="absolute left-3 top-2.5 text-[#9ba8ac] text-xs">⌕</span>
          <input
            type="text"
            placeholder="Search directory"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#e4ecee] bg-white text-xs focus:outline-none focus:border-[#087f8c]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#e4ecee]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === tab
                ? 'text-[#087f8c]'
                : 'text-[#8a989c] hover:text-[#102a2f]'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#087f8c] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPeople.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[#64777d] bg-white rounded-2xl border border-[#e4ecee]">
            No contacts found under {activeTab}.
          </div>
        ) : (
          filteredPeople.map((person) => (
            <article
              key={person.id}
              className="bg-white border border-[#e4ecee] rounded-2xl p-6 text-center shadow-sm flex flex-col items-center justify-between"
            >
              <div>
                <div className="w-16 h-16 rounded-full bg-[#dceff0] text-[#087f8c] font-black text-lg grid place-items-center mx-auto mb-3">
                  {person.initials}
                </div>
                <h3 className="text-base font-bold text-[#102a2f] mb-0.5">{person.name}</h3>
                <p className="text-xs font-bold text-[#087f8c] mb-1">{person.role}</p>
                <small className="text-[11px] text-[#8a999d] block">{person.level}</small>
              </div>

              <div className="flex items-center justify-center gap-2 mt-5 pt-3 border-t border-[#f4f7f8] w-full">
                <a
                  href={`mailto:${person.email}`}
                  className="w-8 h-8 rounded-full bg-[#f2f6f6] text-[#667a7f] hover:bg-[#e8f6f7] hover:text-[#087f8c] grid place-items-center text-xs transition-colors"
                  title={`Email ${person.name}`}
                >
                  ✉
                </a>
                <button
                  onClick={() => alert(`Contact details for ${person.name}: ${person.email}`)}
                  className="w-8 h-8 rounded-full bg-[#f2f6f6] text-[#667a7f] hover:bg-[#e8f6f7] hover:text-[#087f8c] grid place-items-center text-xs transition-colors"
                  title="View contact info"
                >
                  ◌
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Consultation Banner */}
      <div className="bg-[#eef8f9] border border-[#d9edef] rounded-2xl p-4 sm:p-5">
        <strong className="block text-xs font-bold text-[#086873]">Consultation information</strong>
        <p className="text-xs text-[#4e7177] mt-1 leading-relaxed">
          Lecturer consultation hours are updated by the department. Check the latest notices on the Announcements tab before visiting an office in person.
        </p>
      </div>
    </div>
  )
}
