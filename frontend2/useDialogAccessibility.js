import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function useDialogAccessibility(onClose, isOpen = true, preventClose = false) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!isOpen) return undefined

    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusable = dialog?.querySelectorAll(FOCUSABLE_SELECTOR)
    const firstFocusable = focusable?.[0]
    const focusFrame = window.requestAnimationFrame(() => (firstFocusable || dialog)?.focus())

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !preventClose) {
        event.preventDefault()
        closeRef.current?.()
        return
      }

      if (event.key !== 'Tab' || !dialog) return
      const currentFocusable = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)]
      if (currentFocusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = currentFocusable[0]
      const last = currentFocusable[currentFocusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [isOpen, preventClose])

  return dialogRef
}
