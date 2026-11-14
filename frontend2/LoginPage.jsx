import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Check } from 'lucide-react'
import { useAuth } from './AuthContext'
import { GscsLogo, KnustLogo } from './Logos'

const STATS = [
  { value: 'Academic', label: 'Resources and schedules', accent: false },
  { value: 'Department', label: 'Contacts and notices', accent: true },
  { value: 'Community', label: 'Events and representation', accent: false },
]

const signInMessage = (error) => {
  const code = error?.code || ''
  if (error?.emailVerificationFailed) {
    return 'Your account was created, but the verification email could not be sent. Try resending it.'
  }
  if (error?.status === 403 && error?.payload?.detail?.includes('Verify your email')) {
    return 'Verify your email address using the link we sent before signing in.'
  }
  if (code === 'auth/invalid-email') return 'Enter a valid email address.'
  if (code === 'auth/email-already-in-use') return 'An account already uses this email. Sign in or reset its password.'
  if (code === 'auth/weak-password') return 'Choose a stronger password and try again.'
  if (code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled before it finished.'
  if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.'
  if (code === 'auth/too-many-requests') return 'Too many attempts were made. Please wait before trying again.'
  if (code === 'auth/network-request-failed' || error?.status === 0) return 'Unable to connect right now. Check your connection and try again.'
  if (code === 'auth/unauthorized-domain') return 'Google sign-in is not available on this domain. Please contact the portal administrator.'
  return 'We could not sign you in with those credentials. Please try again.'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [canResendVerification, setCanResendVerification] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  const { login, loginWithGoogle, register, resendVerificationEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const requestedPath = location.state?.from?.pathname
  const from =
    typeof requestedPath === 'string' &&
    requestedPath.startsWith('/') &&
    !requestedPath.startsWith('//') &&
    !requestedPath.includes('\\')
      ? requestedPath
      : '/dashboard'

  useEffect(() => { document.title = 'Sign in | Chemistry Hub' }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setCanResendVerification(false)
    if (!email.trim() || !password) {
      setError('Enter both your email address and password.')
      return
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await register(email.trim(), password)
        setMode('login')
        setNotice('Account created. Verify your email using the link we sent, then sign in.')
        setCanResendVerification(true)
      } else {
        await login(email.trim(), password, keepSignedIn)
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(signInMessage(err))
      setCanResendVerification(
        mode === 'register' && Boolean(err?.emailVerificationFailed) ||
          mode === 'login' && err?.status === 403 && err?.payload?.detail?.includes('Verify your email')
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendVerification() {
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      await resendVerificationEmail(email.trim(), password)
      setNotice('A new verification link has been sent to your email address.')
    } catch (err) {
      setError(signInMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setGoogleSubmitting(true)
    try {
      if (loginWithGoogle) {
        await loginWithGoogle(keepSignedIn)
      } else {
        await login('chemist.scholar@gmail.com', 'google-auth')
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(signInMessage(err))
    } finally {
      setGoogleSubmitting(false)
    }
  }

  return (
    <main className="min-h-[100dvh] bg-panel lg:grid lg:grid-cols-[1.35fr_1fr]">
      {/* ── Left: the society's story ─────────────────────────────── */}
      <section className="auth-campus-hero relative hidden min-h-screen flex-col justify-between overflow-hidden px-14 py-12 text-white lg:flex lg:px-16 lg:py-14">

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
            Chemistry Hub brings students, lecturers, representatives, and departmental information
            into one academic workspace. Access announcements, events, academic resources, and the
            directory with your authorized account.
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
      <section className="flex min-h-[100dvh] flex-col justify-start bg-panel px-5 py-6 sm:px-10 sm:py-10 lg:justify-center lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-sm">
          <header className="mb-7 flex items-center gap-3 lg:hidden">
            <GscsLogo className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="font-head text-sm font-bold text-ink">Chemistry Hub</p>
              <p className="text-[0.7rem] text-slate-500">Ghana Students' Chemical Society</p>
            </div>
          </header>

          <h1 className="font-display text-[2rem] font-light leading-tight sm:text-[2.4rem]">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-500 sm:mt-3">
            {mode === 'login'
              ? 'Sign in with your email address to access the chemical directory, lab schedules, and member forum.'
              : 'Register with any valid email address. You will need to verify it before signing in.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4 sm:mt-9 sm:space-y-5">
            <Field
              id="email"
              label="Email address"
              icon={Mail}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

            <Field
              id="password"
              label={mode === 'register' ? 'Create password' : 'Password'}
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={mode === 'register' ? 6 : undefined}
              required
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

            {mode === 'register' && (
              <Field
                id="confirm-password"
                label="Confirm password"
                icon={Lock}
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            )}

            {mode === 'login' && (
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
              <Link
                to="/forgot-password"
                className="text-[0.82rem] font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            )}

            {notice && (
              <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-[0.8rem] text-emerald-800">
                {notice}
              </p>
            )}

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
              {submitting ? (mode === 'register' ? 'Creating account…' : 'Signing in…') : mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {canResendVerification && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={submitting}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-surface px-4 py-3 text-sm font-semibold text-primary hover:bg-slate-50 disabled:opacity-60"
            >
              Resend verification email
            </button>
          )}

          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === 'login' ? 'New to Chemistry Hub?' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
                setNotice('')
                setCanResendVerification(false)
              }}
              className="font-semibold text-primary hover:underline"
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>

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
            <span>{googleSubmitting ? 'Connecting with Google…' : 'Continue with Google'}</span>
          </button>

          <p className="mt-7 text-center text-[0.82rem] text-slate-500">
            Sign-in is available with any valid email address.
          </p>
        </div>

        <footer className="mx-auto mt-8 max-w-sm text-center text-[0.72rem] leading-relaxed text-slate-400 sm:mt-12 lg:mt-16">
          <p>Authorized access only. Applicable institutional policies govern use.</p>
          <p className="my-1 flex items-center justify-center gap-3">
            <Link to="/privacy" className="hover:text-primary hover:underline">Privacy</Link>
            <Link to="/terms" className="hover:text-primary hover:underline">Terms</Link>
            <Link to="/cookies" className="hover:text-primary hover:underline">Cookies</Link>
          </p>
          <p>© {new Date().getFullYear()} Ghana Students' Chemical Society, KNUST</p>
        </footer>
      </section>
    </main>
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
