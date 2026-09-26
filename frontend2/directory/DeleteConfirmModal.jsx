import React from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Record',
  message = 'Are you sure you want to delete this item? This action will deactivate the record from directory listings.',
  itemName,
  isDeleting = false,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-surface rounded-2xl border border-border p-6 shadow-card z-10 animate-in zoom-in-95">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--destructive-soft)] text-destructive grid place-items-center flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            {itemName && (
              <p className="text-xs font-semibold text-primary mt-1 bg-[var(--primary-soft)] px-2.5 py-1 rounded-md inline-block">
                {itemName}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#f2f6f7]">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-destructive hover:opacity-90 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isDeleting && <Loader2 size={13} className="animate-spin" />}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
