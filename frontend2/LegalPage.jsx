import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GscsLogo } from './Logos'

const UPDATED_DATE = 'September 26, 2026'
const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim()

const privacySections = [
  {
    title: 'Information processed',
    body: 'Chemistry Hub processes Firebase account identifiers, email address, display name, application role, and account timestamps. Directory records may include names, student or staff identifiers, academic roles, contact details, biographies, office information, and profile images when administrators provide them.',
  },
  {
    title: 'Why it is used',
    body: 'This information is used to authenticate members, apply student and administrator permissions, maintain profiles, publish department information, and provide the academic directory and announcements.',
  },
  {
    title: 'Services and storage',
    body: 'Authentication is provided by Firebase. Application records are stored in PostgreSQL hosted by Supabase, and approved directory images may be stored in Supabase Storage. The API and frontend are configured for Render and Vercel deployment. Google Fonts is loaded by the frontend and may receive standard connection information such as an IP address and browser metadata.',
  },
  {
    title: 'Cookies and browser storage',
    body: 'Chemistry Hub does not initialize advertising or analytics trackers. Firebase uses essential browser storage to maintain the selected sign-in session. The portal stores theme and sidebar preferences locally. API bearer tokens are held in memory and are not copied into localStorage by the application.',
  },
  {
    title: 'Retention and access requests',
    body: 'The repository does not define a fixed institutional retention schedule. Account and directory records should be retained only while needed for portal and departmental administration. Requests to access, correct, or delete personal information require identity verification and institutional review before records are changed.',
  },
  {
    title: 'Security',
    body: 'The portal uses Firebase identity verification, server-side role checks, encrypted HTTPS deployment, strict request validation, and restricted administrative endpoints. No online service can guarantee absolute security.',
  },
]

const termsSections = [
  {
    title: 'Authorized use',
    body: 'The portal is provided for authorized Chemistry Hub students, staff, and administrators. Users must provide accurate account information, protect their sign-in access, and promptly report suspected unauthorized use.',
  },
  {
    title: 'Acceptable conduct',
    body: 'Users must not bypass access controls, impersonate another person, interfere with portal availability, introduce malicious content, scrape personal information, or use academic materials in violation of applicable university rules or intellectual-property rights.',
  },
  {
    title: 'Academic and directory content',
    body: 'Announcements, schedules, contact details, and academic resources may change. Users should confirm time-sensitive or safety-critical information through official departmental channels. Uploading or publishing content does not transfer third-party ownership rights.',
  },
  {
    title: 'Administration and availability',
    body: 'Authorized administrators may correct, unpublish, or restrict content and accounts when required for security, accuracy, or acceptable use. Service availability is not guaranteed and may be interrupted for maintenance or circumstances outside the project team’s control.',
  },
  {
    title: 'Institutional review',
    body: 'These terms are an operational baseline and must be reviewed by the responsible university or society representative before production launch. The repository does not establish a legal entity, governing law, or institution-approved dispute process.',
  },
]

export default function LegalPage({ type }) {
  const isPrivacy = type === 'privacy'
  const title = isPrivacy ? 'Privacy Notice' : 'Terms of Use'
  const sections = isPrivacy ? privacySections : termsSections

  useEffect(() => {
    document.title = `${title} | Chemistry Hub`
  }, [title])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 font-bold">
            <GscsLogo className="h-9 w-9" />
            <span>Chemistry Hub</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={15} aria-hidden="true" /> Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase text-primary">Legal information</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Effective and last updated: {UPDATED_DATE}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title} aria-labelledby={`${type}-${section.title.replaceAll(' ', '-').toLowerCase()}`}>
              <h2 id={`${type}-${section.title.replaceAll(' ', '-').toLowerCase()}`} className="text-lg font-bold">
                {section.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{section.body}</p>
            </section>
          ))}

          <section aria-labelledby={`${type}-contact`} className="border-t border-border pt-7">
            <h2 id={`${type}-contact`} className="text-lg font-bold">Questions and requests</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {supportEmail ? (
                <>Contact the portal administrator at <a className="font-semibold text-primary hover:underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</>
              ) : (
                <>A public privacy and support email has not yet been configured. Contact the Department of Chemistry administration through established university channels. The deployment owner must configure <code className="rounded bg-surface-secondary px-1 py-0.5">VITE_SUPPORT_EMAIL</code> before production launch.</>
              )}
            </p>
          </section>
        </div>

        <nav aria-label="Legal pages" className="mt-12 flex gap-4 border-t border-border pt-6 text-sm font-semibold text-primary">
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <Link to="/terms" className="hover:underline">Terms</Link>
        </nav>
      </main>
    </div>
  )
}
