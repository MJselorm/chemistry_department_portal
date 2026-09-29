import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ResourceErrorState({
  message = 'Unable to load resources. Please try again.',
  onRetry,
}) {
  return (
    <div className="p-5 bg-[#fdecec] border border-[#f5b3b3] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#c84b4b] shadow-xs">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="w-8 h-8 rounded-xl bg-white/80 grid place-items-center flex-shrink-0 text-[#c84b4b]">
          <AlertCircle size={18} />
        </div>
        <div>
          <strong className="block text-sm font-bold">Failed to load academic resources</strong>
          <span className="text-[#a43b3b] text-xs mt-0.5">{message}</span>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-white text-[#c84b4b] rounded-xl font-bold border border-[#f5b3b3] hover:bg-red-50 text-xs flex items-center gap-1.5 transition-colors shadow-xs flex-shrink-0"
        >
          <RefreshCw size={13} />
          <span>Retry</span>
        </button>
      )}
    </div>
  )
}
