import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ResourcePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}) {
  if (total <= 0 || totalPages <= 1) return null

  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  // Generate page numbers
  const pages = []
  const maxButtons = 5
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2))
  let endPage = Math.min(totalPages, startPage + maxButtons - 1)

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e4ecee] text-xs">
      <span className="text-[#7d9297] font-semibold text-center sm:text-left">
        Showing <strong className="text-[#102a2f]">{startItem}</strong> to{' '}
        <strong className="text-[#102a2f]">{endItem}</strong> of{' '}
        <strong className="text-[#102a2f]">{total}</strong> materials
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-xl border border-[#e4ecee] bg-white text-[#5c7277] hover:text-[#087f8c] hover:bg-[#f6f9fa] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className={`w-8 h-8 rounded-xl font-bold transition-all ${
                page === 1
                  ? 'bg-[#087f8c] text-white shadow-xs'
                  : 'bg-white border border-[#e4ecee] text-[#5c7277] hover:bg-[#f6f9fa]'
              }`}
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-xl font-bold transition-all ${
              page === p
                ? 'bg-[#087f8c] text-white shadow-xs'
                : 'bg-white border border-[#e4ecee] text-[#5c7277] hover:bg-[#f6f9fa]'
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className={`w-8 h-8 rounded-xl font-bold transition-all ${
                page === totalPages
                  ? 'bg-[#087f8c] text-white shadow-xs'
                  : 'bg-white border border-[#e4ecee] text-[#5c7277] hover:bg-[#f6f9fa]'
              }`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-xl border border-[#e4ecee] bg-white text-[#5c7277] hover:text-[#087f8c] hover:bg-[#f6f9fa] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
