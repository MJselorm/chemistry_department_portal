import React from 'react'
import { Filter, X, RotateCcw } from 'lucide-react'

export const RESOURCE_TYPES = [
  'All',
  'Lecture Notes',
  'Past Questions',
  'Textbook',
  'Lab Manual',
  'Syllabus',
  'Slides',
  'Assignment',
  'Other',
]

export const LEVELS = ['All', '100', '200', '300', '400']

export default function ResourceFilters({
  filters,
  onChange,
  onReset,
  availableCourses = [],
  availableFolders = [],
}) {
  const hasActiveFilters =
    (filters.level && filters.level !== 'All') ||
    (filters.resource_type && filters.resource_type !== 'All') ||
    (filters.course && filters.course !== 'All' && filters.course !== '') ||
    (filters.category && filters.category !== 'All' && filters.category !== '') ||
    (filters.folder && filters.folder !== '')

  const handleFieldChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
      page: 1, // Reset page on filter change
    })
  }

  return (
    <div className="bg-white border border-[#e4ecee] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#f0f4f5] pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#102a2f]">
          <Filter size={14} className="text-[#087f8c]" />
          <span>Filters & Categorization</span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-bold text-[#087f8c] hover:text-[#065b64] hover:underline"
          >
            <RotateCcw size={12} />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Level Filter */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#819499] mb-1.5">
            Level
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {LEVELS.map((lvl) => {
              const isSelected = (filters.level || 'All') === lvl
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleFieldChange('level', lvl)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#102a2f] text-white shadow-xs'
                      : 'bg-[#f6f9fa] text-[#5e747a] hover:bg-[#ebf2f4]'
                  }`}
                >
                  {lvl === 'All' ? 'All' : `${lvl}`}
                </button>
              )
            })}
          </div>
        </div>

        {/* Resource Type Dropdown */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#819499] mb-1.5">
            Resource Type
          </label>
          <select
            value={filters.resource_type || 'All'}
            onChange={(e) => handleFieldChange('resource_type', e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] focus:outline-none focus:border-[#087f8c] shadow-xs"
          >
            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === 'All' ? 'All Resource Types' : type}
              </option>
            ))}
          </select>
        </div>

        {/* Course Filter (Input or Select) */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#819499] mb-1.5">
            Course / Code
          </label>
          {availableCourses.length > 0 ? (
            <select
              value={filters.course || 'All'}
              onChange={(e) => handleFieldChange('course', e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] focus:outline-none focus:border-[#087f8c] shadow-xs"
            >
              <option value="All">All Courses</option>
              {availableCourses.map((c) => (
                <option key={c.id || c.course_code} value={c.course_code || c.course_name}>
                  {c.course_code ? `${c.course_code} - ` : ''}
                  {c.course_name || c.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. CEN 212 or CHEM 101"
              value={filters.course && filters.course !== 'All' ? filters.course : ''}
              onChange={(e) => handleFieldChange('course', e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] placeholder-[#9ba8ac] focus:outline-none focus:border-[#087f8c] shadow-xs"
            />
          )}
        </div>

        {/* Category or Folder Filter */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#819499] mb-1.5">
            Folder / Subfolder
          </label>
          {availableFolders.length > 0 ? (
            <select
              value={filters.folder || ''}
              onChange={(e) => handleFieldChange('folder', e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] focus:outline-none focus:border-[#087f8c] shadow-xs"
            >
              <option value="">All Folders</option>
              {availableFolders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. Past Questions or Labs"
              value={filters.folder || ''}
              onChange={(e) => handleFieldChange('folder', e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#e4ecee] bg-white text-[#102a2f] placeholder-[#9ba8ac] focus:outline-none focus:border-[#087f8c] shadow-xs"
            />
          )}
        </div>
      </div>
    </div>
  )
}
