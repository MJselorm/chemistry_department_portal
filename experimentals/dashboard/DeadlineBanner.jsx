import { CircleCheckBig } from 'lucide-react'

export default function DeadlineBanner({ deadline }) {
  if (!deadline) return null

  return (
    <article className="mt-4 flex flex-wrap items-center gap-5 rounded-2xl bg-ink p-5 text-white">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-200">
        <CircleCheckBig size={20} strokeWidth={1.8} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-cyan-300">
          {deadline.label} · {deadline.remaining}
        </p>
        <h3 className="mt-1.5 font-display text-[1.4rem] font-medium leading-snug">
          {deadline.title}
        </h3>
      </div>

      <p className="font-mono text-[0.8rem] tracking-[0.08em] text-white/85">
        {deadline.due_day} · {deadline.due_time}
      </p>
    </article>
  )
}
