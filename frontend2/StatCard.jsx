/**
 * One metric tile. `tone` picks the pill colour so the dues card can read
 * green while the lab-hours card reads blue.
 */
const TONES = {
  blue: 'bg-[#E4F1FC] text-[#1C4E80]',
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-700',
}

export default function StatCard({ label, value, pill, pillTone = 'blue', note, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-hair bg-white p-5 shadow-card">
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-head text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
          {label}
        </h3>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF5FD] text-[#1C4E80]">
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <p className="font-head text-[1.9rem] font-bold leading-none">{value}</p>
        {pill && (
          <span className={`rounded-md px-2 py-1 text-[0.68rem] font-semibold ${TONES[pillTone]}`}>
            {pill}
          </span>
        )}
      </div>

      {note && <p className="mt-2.5 text-[0.78rem] text-slate-500">{note}</p>}
    </article>
  )
}
