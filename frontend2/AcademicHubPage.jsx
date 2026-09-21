import React, { useState } from 'react'
import { MOCK_ACADEMIC_CATEGORIES, MOCK_RECENT_RESOURCES } from './mocks'

export default function AcademicHubPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  const filteredResources = MOCK_RECENT_RESOURCES.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = selectedCategory ? res.category === selectedCategory : true
    return matchesSearch && matchesCat
  })

  const handleDownload = (resource) => {
    alert(`Downloading "${resource.name}" (${resource.meta})... (Placeholder API: GET /academic/resources/${resource.id}/download)`)
  }

  return (
    <div className="space-y-6">
      {/* Page Head */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7d9297]">STUDY CENTRE</span>
          <h1 className="text-2xl font-bold text-[#102a2f] mt-1">Academic Hub</h1>
          <p className="text-xs text-[#64777d] mt-1">
            A structured repository for the materials chemistry students use most.
          </p>
        </div>
        <div className="w-full sm:w-64 relative">
          <span className="absolute left-3 top-2.5 text-[#9ba8ac] text-xs">⌕</span>
          <input
            type="text"
            placeholder="Search resources"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#e4ecee] bg-white text-xs focus:outline-none focus:border-[#087f8c]"
          />
        </div>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {MOCK_ACADEMIC_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.title
          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(isSelected ? null : cat.title)}
              className={`p-4 bg-white border rounded-2xl shadow-sm cursor-pointer flex gap-3.5 items-start transition-all ${
                isSelected
                  ? 'border-[#087f8c] ring-2 ring-[#087f8c]/20'
                  : 'border-[#e4ecee] hover:border-[#b8dfe1]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl grid place-items-center text-lg flex-shrink-0 ${
                  cat.color === 'blue'
                    ? 'bg-[#eaf4fb] text-[#2c79a8]'
                    : cat.color === 'green'
                    ? 'bg-[#eaf7ef] text-[#2b875c]'
                    : cat.color === 'amber'
                    ? 'bg-[#fff5df] text-[#ad740b]'
                    : cat.color === 'purple'
                    ? 'bg-[#f1ebfb] text-[#7652b8]'
                    : cat.color === 'red'
                    ? 'bg-[#fdeeee] text-[#c84b4b]'
                    : 'bg-[#eef2f3] text-[#5b7075]'
                }`}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-[#102a2f] mb-1">{cat.title}</h3>
                <p className="text-[10px] text-[#64777d] leading-relaxed mb-2 line-clamp-2">
                  {cat.description}
                </p>
                <small className="text-[10px] font-bold text-[#087f8c] flex items-center gap-1">
                  {cat.files} {isSelected ? '✓ Filtered' : '→'}
                </small>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recently Added Section */}
      <section className="bg-white border border-[#e4ecee] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7d9297]">RECENTLY ADDED</span>
            <h2 className="text-lg font-bold text-[#102a2f] mt-0.5">
              {selectedCategory ? `Resources in ${selectedCategory}` : 'Latest resources'}
            </h2>
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#d7e2e4] text-[#496066] hover:bg-gray-50"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px] divide-y divide-[#edf1f2]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 py-2.5 text-[9px] uppercase tracking-wider font-extrabold text-[#94a1a5]">
              <span className="col-span-6">Resource</span>
              <span className="col-span-2">Category</span>
              <span className="col-span-2">Added</span>
              <span className="col-span-2 text-right">Action</span>
            </div>

            {/* Table Rows */}
            {filteredResources.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64777d]">
                No matching materials found.
              </div>
            ) : (
              filteredResources.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 py-3.5 items-center text-xs">
                  <div className="col-span-6">
                    <strong className="block text-xs font-bold text-[#102a2f]">{item.name}</strong>
                    <small className="block text-[10px] text-[#98a5a8] mt-0.5">{item.meta}</small>
                  </div>
                  <span className="col-span-2 text-xs text-[#64777d]">{item.category}</span>
                  <span className="col-span-2 text-xs text-[#98a5a8]">{item.added}</span>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => handleDownload(item)}
                      className="text-xs font-bold text-[#087f8c] hover:underline"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
