import React from 'react'

export default function ResourceSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-[#e4ecee] rounded-2xl p-5 shadow-xs flex flex-col justify-between animate-pulse min-h-[200px]"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-5 bg-slate-200 rounded-lg" />
              <div className="w-20 h-5 bg-slate-200 rounded-lg" />
            </div>

            <div className="w-3/4 h-5 bg-slate-200 rounded mb-2" />
            <div className="w-1/2 h-3 bg-slate-100 rounded mb-4" />
            <div className="w-full h-6 bg-slate-100 rounded-lg mb-3" />
          </div>

          <div className="pt-3 border-t border-[#f0f4f5]">
            <div className="flex justify-between mb-3">
              <div className="w-16 h-3 bg-slate-100 rounded" />
              <div className="w-20 h-3 bg-slate-100 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 bg-slate-100 rounded-xl" />
              <div className="h-8 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
