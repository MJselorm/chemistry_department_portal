import { useState } from 'react'
import { Bell, Search } from 'lucide-react'
import DayPanel from '../components/hub/DayPanel'
import ModuleList from '../components/hub/ModuleList'
import DeadlineBanner from '../components/hub/DeadlineBanner'
import { DepartmentEvents, DepartmentNote, DirectoryCard } from '../components/hub/SidePanels'
import { useResource } from '../api/useApi'
import { HUB_ENDPOINTS } from '../api/endpoints'
import {
  MOCK_DEADLINE,
  MOCK_DEPT_EVENTS,
  MOCK_DIRECTORY,
  MOCK_MODULES,
  MOCK_NOTE,
  MOCK_TODAY,
} from '../api/hubMocks'

export default function AcademicHubPage() {
  const today = useResource(HUB_ENDPOINTS.today, MOCK_TODAY)
  const modules = useResource(HUB_ENDPOINTS.modules, MOCK_MODULES)
  const deadline = useResource(HUB_ENDPOINTS.nextDeadline, MOCK_DEADLINE)
  const note = useResource(HUB_ENDPOINTS.departmentNote, MOCK_NOTE)
  const deptEvents = useResource(HUB_ENDPOINTS.departmentEvents, MOCK_DEPT_EVENTS)
  const directory = useResource(HUB_ENDPOINTS.directory, MOCK_DIRECTORY)

  const [selectedDay, setSelectedDay] = useState(null)
  const [query, setQuery] = useState('')

  const t = today.data ?? {}

  return (
    <div className="min-h-screen bg-white px-6 py-10 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[76rem]">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-cyan-700">
              Academic hub / {t.date_label ?? '—'}
            </p>
            <h1 className="mt-3 font-display text-[2.8rem] font-medium leading-none">
              Good morning, {t.greeting_name ?? 'there'}.
            </h1>
            <p className="mt-3 text-[0.95rem] text-slate-600">{t.summary_line}</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 rounded-xl border border-hair bg-white px-4 py-3 transition-colors focus-within:border-cyan-500">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search portal"
                aria-label="Search portal"
                className="w-40 bg-transparent text-[0.88rem] outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              className="rounded-xl border border-transparent p-3 text-slate-500 transition-colors hover:bg-canvas hover:text-ink"
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        <div className="mt-8">
          <DayPanel
            today={t}
            loading={today.loading}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
          <div>
            <ModuleList modules={modules.data ?? []} loading={modules.loading} />
            <DeadlineBanner deadline={deadline.data} />
          </div>

          <aside className="space-y-5 lg:pt-[4.4rem]">
            <DepartmentNote note={note.data} />
            <DepartmentEvents events={deptEvents.data ?? []} />
            <DirectoryCard peerCount={directory.data?.peer_count ?? 0} />
          </aside>
        </div>
      </div>
    </div>
  )
}
