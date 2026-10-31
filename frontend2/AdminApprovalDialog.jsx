import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from './AuthContext'
import { firebaseAuth } from './firebase'

export default function AdminApprovalDialog({ request, onClose, onApprove }) {
  const {
    reauthenticateForRoleApproval,
    reauthenticateWithPasswordForRoleApproval,
    sendRoleApprovalSms,
    completeRoleApprovalMfa,
  } = useAuth()
  const [password, setPassword] = useState('')
  const [resolver, setResolver] = useState(null)
  const [hints, setHints] = useState([])
  const [factorUid, setFactorUid] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const startVerification = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const passwordProvider = firebaseAuth.currentUser?.providerData.some(
        (provider) => provider.providerId === 'password',
      )
      const result = passwordProvider
        ? await reauthenticateWithPasswordForRoleApproval(password)
        : await reauthenticateForRoleApproval()
      const availableHints = result.hints.filter((hint) => ['phone', 'totp'].includes(hint.factorId))
      if (!availableHints.length) {
        throw new Error('Enroll a Firebase phone or authenticator-app MFA factor before approving role changes.')
      }
      setResolver(result.resolver)
      setHints(availableHints)
      setFactorUid(availableHints[0].uid)
    } catch (verificationError) {
      setError(verificationError.message || 'Unable to verify your identity.')
    } finally {
      setBusy(false)
    }
  }

  const sendCode = async () => {
    setBusy(true)
    setError('')
    try {
      setVerificationId(await sendRoleApprovalSms(resolver, factorUid))
    } catch (verificationError) {
      setError(verificationError.message || 'Unable to send an MFA code.')
    } finally {
      setBusy(false)
    }
  }

  const approve = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await completeRoleApprovalMfa(resolver, factorUid, code, verificationId)
      await onApprove(request)
    } catch (verificationError) {
      setError(verificationError.message || 'MFA verification or approval failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-approval-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Super Admin approval</p>
            <h2 id="admin-approval-title" className="mt-1 text-lg font-bold text-foreground">
              Confirm role change
            </h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close approval dialog" className="rounded-md p-1 text-muted-foreground hover:bg-surface-secondary">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-sm text-foreground">
          Approve {request.target.full_name || request.target.email} from{' '}
          <strong>{request.previous_role}</strong> to <strong>{request.requested_role}</strong>?
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Requested by {request.requester.full_name || request.requester.email}. Your recent Firebase MFA verification is required.
        </p>

        {error && <p className="mt-4 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-soft)] p-3 text-xs text-destructive" role="alert">{error}</p>}

        {!resolver ? (
          <form onSubmit={startVerification} className="mt-5 space-y-4">
            <label className="block text-xs font-semibold text-foreground">
              Account password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                placeholder="Re-enter your password"
              />
              <span className="mt-1 block font-normal text-muted-foreground">
                Google accounts can leave this blank and continue with Google re-authentication.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground disabled:opacity-60">Cancel</button>
              <button type="submit" disabled={busy} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                {busy ? 'Verifying…' : 'Verify identity'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={approve} className="mt-5 space-y-4">
            <label className="block text-xs font-semibold text-foreground">
              Verification method
              <select
                value={factorUid}
                onChange={(event) => {
                  setFactorUid(event.target.value)
                  setVerificationId('')
                  setCode('')
                }}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              >
                {hints.map((hint) => (
                  <option key={hint.uid} value={hint.uid}>
                    {hint.factorId === 'phone' ? `Phone ending ${hint.phoneNumber.slice(-4)}` : 'Authenticator app'}
                  </option>
                ))}
              </select>
            </label>

            {hints.find((hint) => hint.uid === factorUid)?.factorId === 'phone' && !verificationId ? (
              <button type="button" onClick={sendCode} disabled={busy} className="w-full rounded-lg border border-border px-3 py-2.5 text-xs font-bold text-primary disabled:opacity-60">
                {busy ? 'Sending code…' : 'Send SMS verification code'}
              </button>
            ) : (
              <label className="block text-xs font-semibold text-foreground">
                {hints.find((hint) => hint.uid === factorUid)?.factorId === 'phone' ? 'SMS verification code' : 'Authenticator code'}
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="Enter verification code"
                />
              </label>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground disabled:opacity-60">Cancel</button>
              <button type="submit" disabled={busy || (hints.find((hint) => hint.uid === factorUid)?.factorId === 'phone' && !verificationId)} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                {busy ? 'Approving…' : 'Verify and approve'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
