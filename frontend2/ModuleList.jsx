const ACCENTS = {
  cyan: 'bg-cyan-200 text-cyan-700',
  amber: 'bg-tint-amber text-amber-800',
  blue: 'bg-tint-blue text-primary',
}

const STATUS_TONES = {
  urgent: 'text-amber-600',
  done: 'text-cyan-700',
  active: 'text-slate-600',
}

export default function ModuleList({ modules = [], loading }) {
  return (
    <section>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-cyan-700">
            Current modules / {String(modules.length).padStart(2, '0')}
          </p>
          <h2 className="mt-2 font-display text-[2rem] font-medium leading-none">
            Courses &amp; lab work
          </h2>
        </div>
        <a
          href="/modules"
          className="font-head text-[0.84rem] font-semibold text-cyan-700 hover:underline"
        >
          Open all modules
        </a>
      </header>

      {loading && <p className="mt-6 font-mono text-[0.8rem] text-slate-400">Loading modules…</p>}

      {!loading && modules.length === 0 && (
        <p className="mt-6 text-[0.9rem] text-slate-500">
          You aren't enrolled in any modules this semester yet. Registration opens in week 1.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {modules.map((mod, i) => (
          <li
            key={mod.id}
            className="flex flex-wrap items-center gap-5 rounded-2xl border border-hair bg-surface p-4 shadow-card"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-mono text-[0.85rem] font-semibold ${
                ACCENTS[mod.accent] ?? ACCENTS.blue
              }`}
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.66rem] font-medium tracking-[0.12em] text-slate-500">
                {mod.course_code}
              </p>
              <h3 className="mt-1 font-head text-[1.02rem] font-semibold leading-snug">
                {mod.title}
              </h3>
              <p className="mt-0.5 text-[0.84rem] text-slate-500">{mod.subtitle}</p>
            </div>

            <div className="w-full sm:w-[9rem]">
              <p
                className={`text-right text-[0.8rem] font-semibold ${
                  STATUS_TONES[mod.status_tone] ?? STATUS_TONES.active
                }`}
              >
                {mod.status}
              </p>
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={mod.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${mod.title} progress`}
              >
                <span
                  className="block h-full rounded-full bg-cyan-600"
                  style={{ width: `${mod.percent}%` }}
                />
              </div>
              <p className="mt-1.5 text-right font-mono text-[0.68rem] text-slate-500">
                {mod.percent}% complete
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
