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
      <div className="fixed left-0 right-0 top-3 z-[80] flex w-full flex-col gap-2 px-3 pointer-events-none sm:left-auto sm:right-5 sm:top-5 sm:max-w-sm sm:px-0" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success'
          const isError = t.type === 'error'

          return (
            <div
              key={t.id}
              role={isError ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-card transition-all transform animate-in fade-in slide-in-from-top-2 text-xs font-medium ${
                isSuccess
                  ? 'bg-[var(--success-soft)] border-[var(--success-border)] text-success'
                  : isError
                  ? 'bg-[var(--destructive-soft)] border-[var(--destructive-border)] text-destructive'
                  : 'bg-[var(--primary-soft)] border-[var(--primary-border)] text-primary'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isSuccess && <CheckCircle2 size={16} className="text-success" />}
                {isError && <AlertCircle size={16} className="text-destructive" />}
                {!isSuccess && !isError && <Info size={16} className="text-primary" />}
              </div>
              <div className="flex-1 break-words leading-relaxed">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-current opacity-70 hover:bg-black/5 hover:opacity-100"
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
