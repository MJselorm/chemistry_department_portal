import { MapPin } from 'lucide-react'

/** Session card fills, re-skinned from the reference to the Hexagon palette. */
const KIND_STYLES = {
  lecture: 'bg-tint-blue',
  lab: 'bg-tint-cyan',
  workshop: 'bg-tint-amber',
}

export default function DayPanel({ today, selectedDay, onSelectDay, loading }) {
  const sessions = today?.sessions ?? []

  return (
    <section className="rounded-3xl bg-canvas p-7 sm:p-9">
      <div className="flex flex-wrap items-end justify-between gap-5 pb-6">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">
            Today / Week {today?.week ?? '—'}
          </p>
          <h2 className="mt-2 font-display text-[1.95rem] font-medium leading-none">
            Your laboratory day
          </h2>
        </div>

        <nav className="flex items-center gap-1.5" aria-label="Day of week">
          {(today?.days ?? []).map((day) => {
            const isSelected = (selectedDay ?? today?.days?.find((d) => d.active)?.id) === day.id
            return (
              <button
                key={day.id}
                onClick={() => onSelectDay?.(day.id)}
                aria-current={isSelected ? 'date' : undefined}
                className={`rounded-lg px-3 py-2 font-mono text-[0.72rem] tracking-[0.1em] transition-colors ${
                  isSelected
                    ? 'bg-ink text-white'
                    : 'text-slate-500 hover:bg-surface hover:text-ink'
                }`}
              >
                {day.label} {day.date}
              </button>
            )
          })}
        </nav>
      </div>

      <hr className="border-slate-300/60" />

      {loading && <p className="pt-8 font-mono text-[0.8rem] text-slate-400">Loading sessions…</p>}

      {!loading && sessions.length === 0 && (
        <p className="pt-8 text-[0.9rem] text-slate-500">
          No sessions scheduled. Pick another day above, or book a lab slot.
        </p>
      )}

      <div className="grid gap-5 pt-7 md:grid-cols-3">
        {sessions.map((session) => (
          <article
            key={session.id}
            className={`flex min-h-[11.5rem] flex-col rounded-2xl p-5 ${
              KIND_STYLES[session.kind] ?? KIND_STYLES.lecture
            } ${session.current ? 'ring-2 ring-ink' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-[0.82rem] font-semibold tracking-tight">
                {session.time_range}
              </p>
              <p className="pt-0.5 text-right font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink/55">
                {session.tag}
              </p>
            </div>

            <p className="mt-4 font-mono text-[0.68rem] font-medium tracking-[0.1em] text-ink/60">
              {session.course_code}
            </p>
            <h3 className="mt-1.5 font-display text-[1.45rem] font-medium leading-tight">
              {session.title}
            </h3>
            <p className="mt-3 flex items-center gap-1.5 text-[0.8rem] text-ink/65">
              <MapPin size={13} strokeWidth={1.8} />
              {session.venue}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
