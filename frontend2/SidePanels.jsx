import { ArrowRight, CalendarDays } from 'lucide-react'

export function DepartmentNote({ note }) {
  if (!note) return null
  return (
    <article className="relative rounded-2xl border border-hair bg-white p-6 shadow-card">
      <span className="absolute right-6 top-6 h-2 w-2 rounded-full bg-amber-400" aria-hidden />
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-slate-500">
        {note.eyebrow}
      </p>
      <h3 className="mt-3 max-w-[24ch] font-display text-[1.6rem] font-medium leading-tight">
        {note.title}
      </h3>
      <p className="mt-3 max-w-[48ch] text-[0.88rem] leading-relaxed text-slate-600">{note.body}</p>
      <a
        href={note.href}
        className="mt-5 inline-block font-head text-[0.84rem] font-semibold text-cyan-700 hover:underline"
      >
        {note.link_label}
      </a>
    </article>
  )
}

export function DepartmentEvents({ events = [] }) {
  return (
    <section className="rounded-2xl bg-tint-blue p-6">
      <header className="flex items-center justify-between gap-4">
        <h3 className="font-display text-[1.45rem] font-medium">Department events</h3>
        <CalendarDays size={19} strokeWidth={1.7} className="text-ink/60" />
      </header>

      {events.length === 0 ? (
        <p className="mt-4 text-[0.86rem] text-ink/65">Nothing scheduled this fortnight.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-center gap-4">
              <div className="flex w-[3.2rem] shrink-0 flex-col items-center rounded-lg bg-white py-2">
                <span className="font-mono text-[0.82rem] font-semibold leading-none">
                  {event.day}
                </span>
                <span className="mt-1 font-mono text-[0.58rem] tracking-[0.1em] text-slate-500">
                  {event.month}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="font-head text-[0.95rem] font-semibold leading-snug">
                  {event.title}
                </h4>
                <p className="mt-0.5 text-[0.8rem] text-ink/60">{event.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function DirectoryCard({ peerCount }) {
  return (
    <a
      href="/members"
      className="flex items-center gap-4 rounded-2xl border border-hair bg-white p-5 shadow-card transition-colors hover:border-cyan-200"
    >
      <span className="flex shrink-0 items-center" aria-hidden>
        <span className="h-7 w-7 rounded-full bg-tint-amber" />
        <span className="-ml-2 h-7 w-7 rounded-full bg-tint-blue" />
        <span className="-ml-2 h-7 w-7 rounded-full bg-cyan-200" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-head text-[0.98rem] font-semibold">Student directory</h3>
        <p className="mt-0.5 text-[0.82rem] text-slate-500">Connect with {peerCount} course peers</p>
      </div>
      <ArrowRight size={18} strokeWidth={1.8} className="shrink-0 text-slate-400" />
    </a>
  )
}
