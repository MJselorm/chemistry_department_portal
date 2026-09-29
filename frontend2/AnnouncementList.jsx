import { Megaphone, TriangleAlert, GraduationCap, FlaskConical } from 'lucide-react'

const CATEGORY = {
  safety: { icon: TriangleAlert, className: 'bg-amber-100 text-amber-800' },
  directory: { icon: GraduationCap, className: 'bg-[var(--primary-soft)] text-primary' },
  execs: { icon: FlaskConical, className: 'bg-emerald-100 text-emerald-700' },
}

export default function AnnouncementList({ announcements = [], loading }) {
  return (
    <section className="rounded-2xl border border-hair bg-surface p-5 shadow-card">
      <header className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2.5 font-head text-[1.05rem] font-bold">
          <Megaphone size={19} strokeWidth={2} />
          Recent announcements
        </h2>
        <a href="/announcements" className="text-[0.82rem] font-medium text-cyan-600 hover:underline">
          All feeds
        </a>
      </header>

      {loading && <p className="mt-6 text-[0.85rem] text-slate-400">Loading announcements…</p>}

      {!loading && announcements.length === 0 && (
        <p className="mt-6 text-[0.85rem] text-slate-500">
          No notices this week. Check back after the next exec meeting.
        </p>
      )}

      <ul className="mt-4 divide-y divide-hair">
        {announcements.map((item) => {
          const meta = CATEGORY[item.category] ?? CATEGORY.directory
          const Icon = meta.icon
          return (
            <li key={item.id} className="py-4 first:pt-1 last:pb-1">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.66rem] font-semibold uppercase tracking-wide ${meta.className}`}
                >
                  <Icon size={12} strokeWidth={2.4} />
                  {item.category_label}
                </span>
                <time className="shrink-0 text-[0.74rem] text-slate-400">{item.posted_ago}</time>
              </div>
              <h3 className="mt-2.5 font-head text-[0.98rem] font-semibold">{item.title}</h3>
              <p className="mt-1.5 max-w-[60ch] text-[0.84rem] leading-relaxed text-slate-600">
                {item.body}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
