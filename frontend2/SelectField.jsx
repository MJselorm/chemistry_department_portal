import { ChevronDown } from 'lucide-react'

export default function SelectField({ className = '', wrapperClassName = '', children, ...props }) {
  return (
    <span className={`relative inline-flex min-w-0 ${wrapperClassName || 'w-full'}`}>
      <select
        {...props}
        className={`w-full min-h-10 appearance-none rounded-lg border border-border bg-input px-3 py-2.5 pr-9 text-sm text-foreground shadow-xs transition-colors hover:border-[var(--primary-border)] focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={2}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </span>
  )
}
