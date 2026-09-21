import { Clock, MapPin, CalendarDays } from 'lucide-react'

export default function EventList({ events = [], onRsvp, loading }) {
  return (
    <section className="rounded-2xl border border-hair bg-white p-5 shadow-card">
      <header className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2.5 font-head text-[1.05rem] font-bold">
          <CalendarDays size={19} strokeWidth={2} />
          Upcoming events
        </h2>
        <a href="/events" className="text-[0.82rem] font-medium text-cyan-600 hover:underline">
          View calendar
        </a>
      </header>

      {loading && <p className="mt-6 text-[0.85rem] text-slate-400">Loading events…</p>}

      {!loading && events.length === 0 && (
        <p className="mt-6 text-[0.85rem] text-slate-500">
          Nothing on the calendar yet. New sessions appear here as the exec team schedules them.
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {events.map((event) => (
          <li
            key={event.id}
            className={`flex items-center gap-4 rounded-xl border p-3.5 ${
              event.featured ? 'border-transparent bg-[#E4F1FC]' : 'border-hair bg-white'
            }`}
          >
            <div className="flex w-[3.4rem] shrink-0 flex-col items-center rounded-lg bg-white py-2 ring-1 ring-hair">
              <span className="font-head text-[0.62rem] font-semibold tracking-wide text-slate-500">
                {event.month}
              </span>
              <span className="font-head text-[1.15rem] font-bold leading-tight">{event.day}</span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-head text-[0.95rem] font-semibold leading-snug">{event.title}</h3>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.76rem] text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {event.venue}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={13} /> {event.time_range}
                </span>
              </p>
            </div>

            {event.rsvp_status === 'going' ? (
              <span className="shrink-0 rounded-lg bg-[#D7E9F8] px-3.5 py-2 font-head text-[0.78rem] font-semibold text-[#1C4E80]">
                Going
              </span>
            ) : (
              <button
                onClick={() => onRsvp?.(event.id)}
                className="shrink-0 rounded-lg bg-amber-400 px-3.5 py-2 font-head text-[0.78rem] font-semibold text-ink transition-colors hover:bg-amber-300"
              >
                RSVP
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
