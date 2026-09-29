import React, { useState, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

export default function ResourceSearch({
  value,
  onChange,
  placeholder = 'Search resources, courses, files...',
  isSearching = false,
}) {
  const [localValue, setLocalValue] = useState(value || '')

  // Sync external changes
  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  // Debounce changes to parent (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [localValue, onChange, value])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className="relative w-full">
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ba8ac] pointer-events-none"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-[#e4ecee] bg-white text-xs text-[#102a2f] placeholder-[#9ba8ac] focus:outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/15 shadow-xs transition-all"
      />
      {isSearching ? (
        <Loader2
          size={14}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#087f8c] animate-spin"
        />
      ) : (
        localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 grid place-items-center text-xs transition-colors"
            title="Clear search"
          >
            <X size={12} />
          </button>
        )
      )}
    </div>
  )
}
