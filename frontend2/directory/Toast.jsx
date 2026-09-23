import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 7)
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success'
          const isError = t.type === 'error'

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-card transition-all transform animate-in fade-in slide-in-from-top-2 text-xs font-medium ${
                isSuccess
                  ? 'bg-[#e7f5ed] border-[#a6dec1] text-[#27805a]'
                  : isError
                  ? 'bg-[#fdecec] border-[#f5b3b3] text-[#c84b4b]'
                  : 'bg-[#e8f6f7] border-[#bce4e8] text-[#087f8c]'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isSuccess && <CheckCircle2 size={16} className="text-[#27805a]" />}
                {isError && <AlertCircle size={16} className="text-[#c84b4b]" />}
                {!isSuccess && !isError && <Info size={16} className="text-[#087f8c]" />}
              </div>
              <div className="flex-1 break-words leading-relaxed">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 p-0.5 ml-1 flex-shrink-0 text-current"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showToast: (msg) => console.log('[Toast]', msg),
    }
  }
  return context
}
