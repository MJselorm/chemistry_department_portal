import { useEffect } from 'react'
import { ArrowLeft, Home, LockKeyhole, SearchX, TriangleAlert } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const CONTENT = {
  403: { icon: LockKeyhole, title: 'Access restricted', message: 'Your account does not have permission to open this page.' },
  404: { icon: SearchX, title: 'Page not found', message: 'The page may have moved or the address may be incorrect.' },
  500: { icon: TriangleAlert, title: 'Something went wrong', message: 'Chemistry Hub could not display this page. Please try again.' },
}

export default function StatusPage({ status = 404, error, onRetry }) {
  const navigate = useNavigate()
  const content = CONTENT[status] || CONTENT[404]
  const Icon = content.icon
  useEffect(() => { document.title = `${status} | Chemistry Hub` }, [status])
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-10 text-center">
      <div className="w-full max-w-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-border bg-surface text-primary"><Icon size={22} aria-hidden="true" /></span>
        <p className="mt-5 text-xs font-bold text-muted-foreground">Error {status}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{content.title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{content.message}</p>
        {import.meta.env.DEV && error && (
          <div className="mx-auto mt-4 max-w-sm rounded-lg border border-red-200 bg-red-50 p-3 text-left font-mono text-[11px] text-red-700 overflow-auto max-h-40">
            <strong>Error:</strong> {error.message || String(error)}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {onRetry && <button type="button" onClick={onRetry} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-white">Try again</button>}
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-xs font-bold text-foreground"><ArrowLeft size={14} />Go back</button>
          <Link to="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-xs font-bold text-foreground"><Home size={14} />Dashboard</Link>
        </div>
      </div>
    </main>
  )
}
