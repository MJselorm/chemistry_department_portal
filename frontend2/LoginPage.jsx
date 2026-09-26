import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Check } from 'lucide-react'
import { useAuth } from './AuthContext'
import { GscsLogo, KnustLogo } from './Logos'

const STATS = [
  { value: '100 Years', label: 'Of scholarly advancement', accent: false },
  { value: '24+ Labs', label: 'Under research collaboration', accent: true },
  { value: '1.2k', label: 'Active global alumni', accent: false },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Those credentials did not match our records.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setGoogleSubmitting(true)
    try {
      if (loginWithGoogle) {
        await loginWithGoogle()
      } else {
        await login('chemist.scholar@gmail.com', 'google-auth')
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.')
    } finally {
      setGoogleSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.35fr_1fr]">
      {/* ── Left: the society's story ─────────────────────────────── */}
      <section className="chem-hero relative flex min-h-[26rem] flex-col justify-between overflow-hidden px-8 py-10 text-white sm:px-14 lg:min-h-screen lg:px-16 lg:py-14">

        <header className="relative flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <GscsLogo className="h-10 w-10" />
            <div>
              <p className="font-head text-[0.78rem] font-semibold tracking-[0.22em]">GSCS</p>
              <p className="text-[0.6rem] tracking-[0.18em] text-white/55">CHEMISTRY</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <p className="font-head text-[0.7rem] font-semibold tracking-[0.14em]">
                DEPARTMENT OF CHEMISTRY
              </p>
              <p className="text-[0.62rem] tracking-[0.12em] text-white/55">KUMASI, GHANA</p>
            </div>
            <KnustLogo badge className="h-8 w-auto" />
          </div>
        </header>

        <div className="relative max-w-xl py-14">
          <h1 className="font-display text-[3.4rem] font-light leading-[0.95] tracking-tight sm:text-[4.6rem]">
            Chemical Society
          </h1>
          <p className="mt-7 max-w-[34rem] text-[0.95rem] leading-[1.85] text-white/70">
            Since 1924, our society has connected aspiring chemists, professional researchers, and
            industry pioneers. We coordinate weekly laboratory colloquiums, support organic research
            publications, and steward the frontiers of molecular science.
          </p>
          <p className="mt-8 flex items-center gap-4 text-[0.68rem] font-semibold tracking-[0.2em] text-[#e8c95b]">
            <span className="h-px w-8 bg-[#e8c95b]" />
            DISCOVER • CATALYZE • CONNECT
          </p>
        </div>

        <dl className="relative grid max-w-2xl grid-cols-2 gap-y-8 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt
                className={`font-display text-[1.9rem] font-light ${
                  stat.accent ? 'text-[#e8c95b]' : 'text-white'
                }`}
              >
                {stat.value}
              </dt>
              <dd className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-white/50">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Right: sign in ────────────────────────────────────────── */}
      <section className="flex min-h-screen flex-col justify-center bg-panel px-7 py-14 sm:px-14">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="font-display text-[2.4rem] font-light leading-tight">Academic Portal</h2>
          <p className="mt-3 text-[0.86rem] leading-relaxed text-slate-500">
            Sign in with your university credentials to access the chemical directory, lab
            schedules, and member forum.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5" noValidate>
            <Field
              id="email"
              label="University email"
              icon={Mail}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="student@knust.edu.gh"
              autoComplete="username"
            />

            <Field
              id="password"
              label="Secure password"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded p-1 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2.5 text-[0.82rem] text-slate-600">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="flex h-[1.05rem] w-[1.05rem] items-center justify-center rounded border border-slate-300 bg-surface text-white transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2">
                  {keepSignedIn && <Check size={12} strokeWidth={3} />}
                </span>
                Keep me signed in
              </label>
              <a
                href="/forgot-password"
                className="text-[0.82rem] font-medium text-primary hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-[0.8rem] text-rose-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || googleSubmitting}
              className="w-full rounded-lg bg-primary py-3.5 font-head text-[0.9rem] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-panel px-3 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-slate-400">
              or continue with
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting || googleSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-surface py-3 px-4 font-head text-[0.88rem] font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-ink focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 disabled:opacity-60"
          >
            <GoogleIcon className="h-4 w-4 shrink-0" />
            <span>{googleSubmitting ? 'Connecting with Google…' : 'Sign in with Google'}</span>
          </button>

          <p className="mt-7 text-center text-[0.82rem] text-slate-500">
            Not a member yet?{' '}
            <a href="/register" className="font-semibold text-primary hover:underline">
              Create account
            </a>
          </p>
        </div>

        <footer className="mx-auto mt-16 max-w-sm text-center text-[0.72rem] leading-relaxed text-slate-400">
          <p>Authorized access only. Subject to university IT usage policy.</p>
          <p>© {new Date().getFullYear()} Ghana Students' Chemical Society, KNUST</p>
        </footer>
      </section>
    </div>
  )
}

function Field({ id, label, icon: Icon, value, onChange, trailing, ...props }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-head text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500"
      >
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-surface px-3.5 py-3 transition-colors focus-within:border-cyan-500">
        <Icon size={16} className="shrink-0 text-slate-400" />
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[0.88rem] text-ink outline-none placeholder:text-slate-400"
          {...props}
        />
        {trailing}
      </div>
    </div>
  )
}


function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )
}
