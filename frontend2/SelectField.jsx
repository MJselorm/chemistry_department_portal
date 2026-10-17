import { ChevronDown } from 'lucide-react'

export default function SelectField({ className = '', wrapperClassName = '', children, ...props }) {
  return (
    <span className={`relative inline-flex min-w-0 ${wrapperClassName}`}>
      <select
        {...props}
        className={`w-full appearance-none border border-border bg-surface pr-8 text-foreground shadow-xs transition-colors hover:border-[var(--primary-border)] focus:border-primary focus:outline-none ${className}`}
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
