import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { GscsLogo } from './Logos'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      if (err?.code === 'auth/user-not-found') {
        setSent(true)
      } else if (err?.code === 'auth/invalid-email') {
        setError('Enter a valid email address.')
      } else if (err?.code === 'auth/too-many-requests') {
        setError('Too many attempts were made. Please wait before trying again.')
      } else {
        setError('We could not process the request right now. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <GscsLogo className="h-11 w-11" />
          <div>
            <p className="text-sm font-bold text-foreground">Chemistry Hub</p>
            <p className="text-xs text-muted-foreground">Account recovery</p>
          </div>
        </div>

        <h1 className="font-display text-4xl font-light text-foreground">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Enter the email associated with your Firebase account. If it is eligible for password
          recovery, Firebase will send reset instructions.
        </p>

        {sent ? (
          <div className="mt-7 rounded-lg border border-[var(--success-border)] bg-[var(--success-soft)] p-4 text-sm text-success" role="status">
            Check your inbox for password-reset instructions. For privacy, this confirmation does
            not indicate whether an account exists for that address.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="reset-email" className="mb-2 block text-xs font-bold text-foreground">
                University email
              </label>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-3 focus-within:border-primary">
                <Mail size={16} className="text-muted-foreground" aria-hidden="true" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </div>
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              {submitting ? 'Sending instructions…' : 'Send reset instructions'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
