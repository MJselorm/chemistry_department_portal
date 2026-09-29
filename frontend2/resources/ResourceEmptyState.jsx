import React from 'react'
import { FolderOpen, RotateCcw } from 'lucide-react'

export default function ResourceEmptyState({
  title = 'No resources found',
  description = 'Try changing your search keywords or adjusting your active filters.',
  onReset,
}) {
  return (
    <div className="py-16 text-center text-xs text-[#64777d] bg-white rounded-2xl border border-[#e4ecee] shadow-xs px-4">
      <div className="w-14 h-14 rounded-2xl bg-[#e8f6f7] text-[#087f8c] font-black text-2xl grid place-items-center mx-auto mb-3.5 shadow-xs">
        <FolderOpen size={26} />
      </div>
      <strong className="block text-base font-bold text-[#102a2f] mb-1">
        {title}
      </strong>
      <p className="max-w-md mx-auto text-xs text-[#7d9297] leading-relaxed">
        {description}
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 px-4 py-2 rounded-xl bg-[#087f8c] text-white text-xs font-bold hover:bg-[#06646e] transition-colors inline-flex items-center gap-1.5 shadow-xs"
        >
          <RotateCcw size={13} />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  )
}
