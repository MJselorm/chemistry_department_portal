import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck,
  FileText,
  Globe,
  HelpCircle,
  Lock,
  Mail,
  Scale,
  Server,
  Shield,
  ShieldAlert,
  Smartphone,
  User,
  Users,
} from 'lucide-react'
import { GscsLogo } from './Logos'
import { useAuth } from './AuthContext'

const EFFECTIVE_DATE = 'September 26, 2026'
const LAST_UPDATED_DATE = 'October 16, 2026'
const supportEmail = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_EMAIL?.trim()) || ''

const sections = [
  {
    id: 'intro-scope',
    title: '1. Introduction and Scope',
    icon: BookOpen,
    content: (
      <>
        <p>
          Welcome to <strong>Chemistry Hub</strong> (the &ldquo;Portal&rdquo;), the academic and departmental web application
          operated for students, faculty, and administrative staff associated with the Department of Chemistry within the
          College of Science at Kwame Nkrumah University of Science and Technology (KNUST), in collaboration with the Ghana
          Students&rsquo; Chemical Society (GSCS-KNUST).
        </p>
        <p className="mt-3">
          This Privacy Policy sets out how personal information is collected, processed, stored, and safeguarded when you
          access and use Chemistry Hub. This policy is established in accordance with the provisions of the{' '}
          <strong>Data Protection Act, 2012 (Act 843)</strong> of the Republic of Ghana, which gives effect to Article 18(2)
          of the 1992 Constitution of Ghana guaranteeing the fundamental right to personal privacy.
        </p>
        <p className="mt-3">
          This policy applies strictly to the Chemistry Hub web platform, including authenticated student pages,
          academic resource study centres, departmental directory rosters, event calendars, announcement feeds, and device
          push notification services.
        </p>
      </>
    ),
  },
  {
    id: 'identity-controller',
    title: '2. Identity and Contact Details of the Data Controller',
    icon: Shield,
    content: (
      <>
        <p>
          For the purposes of the Data Protection Act, 2012 (Act 843), the <strong>Data Controller</strong> responsible for
          determining the purposes and means of processing personal data within Chemistry Hub is:
        </p>
        <div className="mt-4 rounded-xl border border-border bg-surface-secondary/50 p-4 text-xs leading-relaxed">
          <p className="font-bold text-foreground">Ghana Students&rsquo; Chemical Society (GSCS-KNUST)</p>
          <p className="mt-0.5 text-muted-foreground">In partnership with the Department of Chemistry</p>
          <p className="text-muted-foreground">College of Science, Kwame Nkrumah University of Science and Technology (KNUST)</p>
          <p className="text-muted-foreground">PMB, UPO, Kumasi, Ashanti Region, Republic of Ghana</p>
          <p className="mt-2 text-muted-foreground">
            <strong>Official Privacy Inquiries:</strong>{' '}
            {supportEmail ? (
              <a href={`mailto:${supportEmail}`} className="font-semibold text-primary hover:underline">
                {supportEmail}
              </a>
            ) : (
              <span>
                Department Administration Office or email configured via{' '}
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px] text-foreground">VITE_SUPPORT_EMAIL</code>
              </span>
            )}
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Under Section 46 of Act 843, data controllers operating in Ghana are subject to registration with the{' '}
          <strong>Data Protection Commission (DPC)</strong> of Ghana. The operational administration of Chemistry Hub is
          conducted within this institutional framework.
        </p>
      </>
    ),
  },
  {
    id: 'categories-collected',
    title: '3. Categories of Personal Information Collected',
    icon: FileText,
    content: (
      <>
        <p>Chemistry Hub processes only personal data necessary to provide academic and portal services. Verified categories include:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Account Identifiers:</strong> Email address, Firebase unique user identifier (UID), full display name,
            assigned system role (<code className="rounded bg-surface-secondary px-1 text-[11px]">student</code> or{' '}
            <code className="rounded bg-surface-secondary px-1 text-[11px]">admin</code>), and account creation/update timestamps.
          </li>
          <li>
            <strong>Academic Directory Records:</strong> For appointed student leaders (executives, class representatives, course
            representatives), faculty lecturers, committee members, and departmental contacts: full name, student ID or staff ID,
            level/year of study (e.g. CHEM 100 to 400), academic programme, institutional telephone contact, official email address,
            office location, consultation hours, academic bio/qualifications, and profile photographs.
          </li>
          <li>
            <strong>Device &amp; Push Notification Data:</strong> When push notifications are explicitly enabled: Web Push
            subscription endpoint URL, cryptographic authentication keys (P256DH key and auth secret), browser user-agent
            string, delivery attempt counts, and notification read/dismissal timestamps.
          </li>
          <li>
            <strong>Client Preferences:</strong> User interface theme (<code className="rounded bg-surface-secondary px-1 text-[11px]">light</code> or{' '}
            <code className="rounded bg-surface-secondary px-1 text-[11px]">dark</code>) and sidebar navigation collapsed state, stored
            exclusively in your device&rsquo;s local storage.
          </li>
          <li>
            <strong>Academic Resources &amp; Uploads:</strong> Study course materials, lecture notes, syllabi, past examination questions,
            and administrative announcements uploaded by verified faculty and administrators.
          </li>
        </ul>
        <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Information We Do NOT Collect:</strong> Chemistry Hub does not collect National Identity
          Card numbers (Ghana Card numbers), biometric records, financial or mobile money transaction details, religious affiliation,
          political opinions, or precise GPS location data.
        </div>
      </>
    ),
  },
  {
    id: 'sources-info',
    title: '4. Sources of Personal Information',
    icon: User,
    content: (
      <>
        <p>In accordance with Section 21 of Act 843 (Collection directly from data subject), personal data is gathered from:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Direct Provision by You:</strong> Data entered when you sign in, update your display name in your profile,
            or grant device permission for web push notifications.
          </li>
          <li>
            <strong>Authentication Providers:</strong> When choosing Google Sign-In, Firebase receives your verified email address,
            name, and Google account identifier as authorized during Google consent.
          </li>
          <li>
            <strong>Departmental Rosters:</strong> Directory listings (executive positions, class reps, lecturer contacts, and
            course timetables) are provided directly by authorized Department of Chemistry and GSCS administrators from official
            academic rosters.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'purposes-bases',
    title: '5. Purposes and Lawful Bases for Processing',
    icon: Scale,
    content: (
      <>
        <p>
          Section 19 (Purpose specification) and Section 20 (Lawfulness of processing) of Act 843 require personal data to be
          processed for explicitly specified and lawful reasons. Our processing purposes and legal bases are:
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 text-xs">
            <div className="p-4 space-y-2">
              <strong className="text-foreground block">Processing Purpose</strong>
              <p className="text-muted-foreground">User authentication, session verification, and role-based access control.</p>
              <p className="text-muted-foreground">Academic resource distribution and study material preview/download.</p>
              <p className="text-muted-foreground">Publishing official departmental announcements and academic calendar events.</p>
              <p className="text-muted-foreground">Delivering opt-in device push notifications for important notices.</p>
              <p className="text-muted-foreground">Facilitating student-to-representative and student-to-lecturer directory contact.</p>
            </div>
            <div className="p-4 space-y-2 bg-surface-secondary/30">
              <strong className="text-foreground block">Lawful Basis (Act 843)</strong>
              <p className="text-muted-foreground"><strong>Consent (Section 20(1)):</strong> Provided upon sign-in and push enablement.</p>
              <p className="text-muted-foreground"><strong>Contract / Educational Mandate:</strong> Performance of core student service provision.</p>
              <p className="text-muted-foreground"><strong>Legitimate Interest (Section 20(2)):</strong> Departmental communication and student academic welfare.</p>
              <p className="text-muted-foreground"><strong>Explicit Consent:</strong> Device notification permissions granted in browser.</p>
              <p className="text-muted-foreground"><strong>Legitimate Academic Administration:</strong> Published institutional liaison.</p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'authentication-accounts',
    title: '6. Account Creation and Authentication',
    icon: Lock,
    content: (
      <>
        <p>
          Authentication on Chemistry Hub is managed via <strong>Firebase Authentication</strong> (Google Identity Platform).
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Credentials &amp; Security:</strong> When signing in with email and password, authentication is performed
            directly against Firebase over encrypted HTTPS. Passwords are salted, hashed, and managed exclusively by Google.
            Chemistry Hub servers never receive, log, or store your raw password.
          </li>
          <li>
            <strong>Session Management:</strong> Firebase maintains session persistence in your browser (via IndexedDB and session
            storage). Upon successful authentication, Firebase issues a short-lived JSON Web Token (ID token).
          </li>
          <li>
            <strong>Memory-Only API Token Architecture:</strong> Chemistry Hub stores API bearer tokens exclusively in memory
            within the client application (<code className="rounded bg-surface-secondary px-1 text-[11px]">tokenStore</code>). Tokens
            are never written to unencrypted <code className="rounded bg-surface-secondary px-1 text-[11px]">localStorage</code>,
            mitigating cross-site token exfiltration risks.
          </li>
          <li>
            <strong>Backend Synchronization:</strong> The FastAPI backend validates each ID token cryptographically using the
            Firebase Admin SDK and provisions/synchronizes a corresponding user record in our PostgreSQL database.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'academic-profiles',
    title: '7. Academic Profiles and Student Information',
    icon: User,
    content: (
      <>
        <p>
          Each authenticated member has a profile record stored in the backend database with their email, display name, and role.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Self-Service Display Name Rectification:</strong> Under Section 33 of Act 843 (Correction of personal data),
            students can directly edit and update their full display name at any time via the{' '}
            <Link to="/profile" className="font-semibold text-primary hover:underline">
              My Profile
            </Link>{' '}
            page.
          </li>
          <li>
            <strong>Role Enforcement:</strong> User roles (<code className="rounded bg-surface-secondary px-1 text-[11px]">student</code> vs.{' '}
            <code className="rounded bg-surface-secondary px-1 text-[11px]">admin</code>) are strictly protected against client-side
            tampering. Role changes require verified administrative action and cannot be self-assigned.
          </li>
          <li>
            <strong>Directory Transparency:</strong> Student leaders and class representatives listed in the Department Directory
            have their academic contacts visible to authenticated department peers to facilitate academic coordination.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'resources-downloads',
    title: '8. Academic Resources, File Previews, and Downloads',
    icon: BookOpen,
    content: (
      <>
        <p>
          Chemistry Hub provides an Academic Study Centre hosting academic materials including past questions, lecture slide decks,
          lab manuals, and course outlines.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Storage Infrastructure:</strong> Course materials are stored securely in Supabase Storage buckets.
          </li>
          <li>
            <strong>Authenticated Access:</strong> File view and download links are generated dynamically through authenticated
            API routes requiring valid bearer tokens. Public unauthenticated access to study resources is prohibited.
          </li>
          <li>
            <strong>In-Browser Safe Previewing:</strong> Documents (PDF and presentation slides) are previewed locally within your
            browser using sandboxed client-side viewers (such as PDF.js). Executable binary files or dangerous script formats are
            strictly rejected from preview execution.
          </li>
          <li>
            <strong>Academic Purpose:</strong> Resources are intended strictly for educational study by enrolled chemistry students.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'providers-infrastructure',
    title: '9. Database, Hosting, Authentication, and Storage Providers',
    icon: Server,
    content: (
      <>
        <p>
          To deliver a reliable and secure experience, Chemistry Hub utilizes reputable cloud infrastructure providers
          acting as Data Processors under Section 30 of Act 843:
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4 text-xs">
            <strong className="text-foreground text-sm">Google Cloud / Firebase</strong>
            <p className="mt-1 text-muted-foreground">
              Provides identity authentication, OAuth sign-in verification, and web font delivery via Google Fonts.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-xs">
            <strong className="text-foreground text-sm">Supabase (PostgreSQL &amp; Storage)</strong>
            <p className="mt-1 text-muted-foreground">
              Hosts the primary relational database and object storage buckets for academic files and directory photographs.
              Protected by PostgreSQL Row Level Security (RLS) policies.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-xs">
            <strong className="text-foreground text-sm">Vercel &amp; Render</strong>
            <p className="mt-1 text-muted-foreground">
              Vercel provides edge hosting and CDN delivery for the frontend single-page application. Render hosts the containerized
              FastAPI backend service.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'cookies-tracking',
    title: '10. Cookies and Similar Technologies',
    icon: Globe,
    content: (
      <>
        <p>
          Chemistry Hub adheres strictly to privacy-by-design principles:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>No Advertising or Tracking Cookies:</strong> We do NOT employ third-party advertising cookies, behavioural
            profiling scripts, or cross-site tracking pixels.
          </li>
          <li>
            <strong>Essential Browser Storage:</strong>
            <ul className="mt-1.5 list-circle space-y-1 pl-5">
              <li>
                <code className="rounded bg-surface-secondary px-1 text-[11px]">IndexedDB / Session Storage</code>: Used exclusively by
                Firebase Authentication to maintain your sign-in session between browser refreshes.
              </li>
              <li>
                <code className="rounded bg-surface-secondary px-1 text-[11px]">chemhub-theme</code>: Stores your visual theme preference
                (light or dark mode) in your browser&rsquo;s <code className="text-[11px]">localStorage</code>.
              </li>
              <li>
                <code className="rounded bg-surface-secondary px-1 text-[11px]">chemhub-sidebar-collapsed</code>: Remembers whether you
                prefer an expanded or collapsed sidebar navigation layout.
              </li>
            </ul>
          </li>
          <li>
            <strong>Zero Persistent Bearer Tokens:</strong> Bearer API authentication tokens are maintained only in active runtime memory
            and are destroyed immediately upon browser tab closure or sign-out.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'sharing-disclosure',
    title: '11. Information Sharing and Third-Party Processing',
    icon: Users,
    content: (
      <>
        <p>
          Chemistry Hub does <strong>not sell, trade, rent, or commercially exploit</strong> student or faculty personal data.
        </p>
        <p className="mt-3">Personal information is disclosed only in the following strictly limited situations:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong>Internal Departmental Administration:</strong> Authorized student directory listings are made accessible to
            authenticated students and lecturers to facilitate course activities, laboratory coordination, and academic governance.
          </li>
          <li>
            <strong>Authorized Infrastructure Processors:</strong> Transmission to technical infrastructure partners (Google Firebase,
            Supabase, Vercel, Render) solely as necessary to operate database storage and web services under contract.
          </li>
          <li>
            <strong>Legal and Regulatory Compliance:</strong> When disclosure is strictly mandated by the laws of Ghana, a valid court
            order, or a directive from the Data Protection Commission (DPC) or university disciplinary board.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'international-transfers',
    title: '12. International Transfers of Personal Data',
    icon: Globe,
    content: (
      <>
        <p>
          Chemistry Hub is hosted and operated for users primarily located in the Republic of Ghana. However, because our cloud
          infrastructure providers (Google Cloud, Supabase, Render, and Vercel) maintain distributed server networks, personal data
          such as account records, push subscription endpoints, and uploaded academic documents may be processed on servers
          located in data centres outside Ghana (including the European Union and the United States).
        </p>
        <p className="mt-3">
          In compliance with Section 45 and Section 47(1)(f) of Act 843:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            Cloud processors maintain enterprise-grade security controls, industry standard certifications (ISO/IEC 27001, SOC 2),
            and robust encryption for data at rest and data in transit.
          </li>
          <li>
            International data transfers are disclosed as part of the Data Controller&rsquo;s registration filings with the
            Ghana Data Protection Commission.
          </li>
          <li>
            By creating an account and utilizing Chemistry Hub, you acknowledge and consent to this cross-border transmission
            strictly for portal hosting and operations.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'retention-deletion',
    title: '13. Data Retention and Secure Deletion',
    icon: Calendar,
    content: (
      <>
        <p>
          In accordance with Section 24 of Act 843 (Retention of records), personal data is retained only for the duration
          necessary to fulfill legitimate educational and departmental purposes:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Active Student Accounts:</strong> Maintained for the duration of your academic studies in the Department of Chemistry
            or until an account deletion request is approved.
          </li>
          <li>
            <strong>Student Directory Rosters:</strong> Executive and representative listings are updated and rotated annually as
            academic years conclude and new leadership assumes office.
          </li>
          <li>
            <strong>Push Notification Endpoints:</strong> Inactive or invalid push subscriptions are automatically pruned from the
            database after recurring delivery errors (<code className="rounded bg-surface-secondary px-1 text-[11px]">failure_count &gt; 3</code>).
          </li>
          <li>
            <strong>Secure Deletion:</strong> When an account or record is deleted upon verified request, it is removed from active
            database tables using cascading database integrity constraints.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'security-measures',
    title: '14. Security Measures and Limitations',
    icon: ShieldAlert,
    content: (
      <>
        <p>
          In fulfillment of Section 28 (Security measures) and Section 30 of Act 843, Chemistry Hub implements technical and
          organizational safeguards:
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-xl border border-border bg-surface p-3.5 space-y-1">
            <strong className="text-foreground block">HTTPS / TLS Encryption</strong>
            <p className="text-muted-foreground">All data transferred between your browser, the API, and Supabase is encrypted with modern TLS.</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5 space-y-1">
            <strong className="text-foreground block">PostgreSQL Row Level Security (RLS)</strong>
            <p className="text-muted-foreground">RLS is active across public database tables, blocking direct unauthorized PostgREST access.</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5 space-y-1">
            <strong className="text-foreground block">Server-Side Token Verification</strong>
            <p className="text-muted-foreground">Every incoming API request is validated against Google Firebase Admin SDK cryptographic keys.</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5 space-y-1">
            <strong className="text-foreground block">Role-Based Access Control (RBAC)</strong>
            <p className="text-muted-foreground">Administrative routes and destructive endpoints are guarded by server-enforced role checks.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          <strong>Important Security Limitation:</strong> While we employ industry-standard safeguards, no transmission over the
          internet or electronic storage system is 100% impenetrable. Users are responsible for safeguarding their login
          credentials, securing their personal devices, and promptly reporting any suspected security incidents.
        </p>
      </>
    ),
  },
  {
    id: 'user-rights',
    title: '15. Users’ Privacy Rights Under Act 843',
    icon: FileCheck,
    content: (
      <>
        <p>Under the Data Protection Act, 2012 (Act 843), you are endowed with distinct statutory rights as a Data Subject:</p>
        <div className="mt-3 space-y-2 text-xs">
          <div className="rounded-lg border border-border bg-surface p-3">
            <strong className="text-foreground">Right of Access (Section 32):</strong> You have the right to request confirmation of
            whether Chemistry Hub holds personal data regarding you, and to receive a clear copy or description of that data.
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <strong className="text-foreground">Right to Rectification (Section 33 &amp; 44):</strong> You have the right to request
            correction of inaccurate, incomplete, or misleading data. You can directly edit your display name in{' '}
            <Link to="/profile" className="font-semibold text-primary hover:underline">My Profile</Link>.
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <strong className="text-foreground">Right to Erasure / Deletion (Section 33 &amp; 44):</strong> You have the right to request
            the deletion or removal of personal data where there is no legal or educational justification for its retention.
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <strong className="text-foreground">Right to Prevent Processing (Section 35 &amp; 40):</strong> You have the right to object to
            processing that causes or is likely to cause unwarranted substantial damage or distress.
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <strong className="text-foreground">Right Regarding Automated Decision-Making (Section 37):</strong> Chemistry Hub does NOT
            perform automated decision-making, algorithms, or profiling that significantly affects your rights or academic standing.
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <strong className="text-foreground">Right to Withdraw Consent:</strong> You may freely revoke push notification permissions
            at any time through your browser settings or directly via the{' '}
            <Link to="/settings" className="font-semibold text-primary hover:underline">Settings</Link> page.
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'submit-requests',
    title: '16. How to Submit Privacy Requests and Complaints',
    icon: Mail,
    content: (
      <>
        <p>
          To safeguard user privacy and prevent unauthorized data disclosures, all Data Subject Requests under Act 843 must
          undergo identity verification:
        </p>
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary-soft/10 p-4 text-xs space-y-3">
          <p className="font-bold text-foreground">Step-by-Step Request Procedure:</p>
          <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
            <li>
              Send an email from your <strong>registered institutional email address</strong> to the privacy contact.
            </li>
            <li>
              State clearly in the subject line: <code className="text-foreground font-mono">[Chemistry Hub Privacy Request] - Student ID</code>.
            </li>
            <li>Specify whether you are requesting Access, Correction of records, or Account Deletion.</li>
            <li>
              Department administrators will review and verify your identity before processing modifications or disclosures.
            </li>
          </ol>
        </div>
        <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-xs text-muted-foreground">
          <p className="font-bold text-foreground">Filing a Complaint with the Supervisory Authority (Section 75):</p>
          <p className="mt-1">
            If you believe your privacy rights under Act 843 have been infringed and our administrative team has not resolved
            your inquiry satisfactorily, you have the statutory right under Section 75 to lodge a formal complaint with the:
          </p>
          <p className="mt-2 font-semibold text-foreground">Data Protection Commission (DPC) Ghana</p>
          <p>East Legon, Near Mensvic Grand Hotel, Accra, Ghana</p>
          <p>
            Website:{' '}
            <a
              href="https://www.dataprotection.org.gh"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              www.dataprotection.org.gh <ExternalLink size={11} aria-hidden="true" />
            </a>
          </p>
          <p>Email: <a href="mailto:complaints@dataprotection.org.gh" className="font-semibold text-primary hover:underline">complaints@dataprotection.org.gh</a></p>
        </div>
      </>
    ),
  },
  {
    id: 'younger-users',
    title: '17. Protection of Younger Users',
    icon: Shield,
    content: (
      <>
        <p>
          Chemistry Hub is an academic portal designed exclusively for university students, faculty members, and authorized staff
          at Kwame Nkrumah University of Science and Technology. The portal is not directed to children under the age of majority.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Any matriculated student who has not yet reached 18 years of age is enrolled within the university&rsquo;s official
          academic framework and receives all applicable protections under the laws of Ghana and institutional regulations.
        </p>
      </>
    ),
  },
  {
    id: 'data-breaches',
    title: '18. Data Breaches and Incident Handling',
    icon: ShieldAlert,
    content: (
      <>
        <p>
          In adherence to <strong>Section 31 of Act 843 (Notification of security compromise)</strong>:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            In the event that personal data is accessed or acquired by an unauthorized person, the Data Controller will immediately
            notify the <strong>Data Protection Commission (DPC)</strong> in writing without unreasonable delay.
          </li>
          <li>
            Affected data subjects will be notified promptly via their registered email address or official in-portal announcement,
            including a description of the incident, likely consequences, and protective measures being implemented.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'policy-changes',
    title: '19. Policy Changes and Notification of Material Updates',
    icon: Calendar,
    content: (
      <>
        <p>
          We may update this Privacy Policy periodically to reflect technological enhancements, operational changes, or statutory
          amendments under Ghanaian data protection law.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            The <strong>Effective Date</strong> and <strong>Last Updated Date</strong> at the top of this document indicate when
            revisions took effect.
          </li>
          <li>
            Material modifications will be notified to registered users through the portal&rsquo;s Announcement feed (
            <Link to="/announcements" className="font-semibold text-primary hover:underline">Department Announcements</Link>
            ) or via email notice prior to taking effect.
          </li>
          <li>
            Continued access or use of Chemistry Hub following published updates constitutes acknowledgment of the revised policy.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'contact-details',
    title: '20. Contact Details for Privacy Enquiries',
    icon: Mail,
    content: (
      <>
        <p>For questions, clarifications, or requests concerning this Privacy Policy or your personal data:</p>
        <div className="mt-4 rounded-xl border border-border bg-surface p-5 space-y-3 text-xs">
          <div>
            <strong className="block text-sm text-foreground">Department Privacy Administration</strong>
            <p className="text-muted-foreground mt-0.5">Department of Chemistry, College of Science, KNUST</p>
            <p className="text-muted-foreground">Kumasi, Ashanti Region, Ghana</p>
          </div>
          <div className="pt-2 border-t border-border">
            <strong className="text-foreground">Designated Support Email:</strong>
            <p className="mt-1">
              {supportEmail ? (
                <a
                  href={`mailto:${supportEmail}?subject=${encodeURIComponent('[Chemistry Hub Privacy Inquiry]')}`}
                  className="font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
                >
                  <Mail size={13} /> {supportEmail}
                </a>
              ) : (
                <span className="text-muted-foreground">
                  A public support address has not yet been configured in the environment. Contact the Department of
                  Chemistry administration directly through official university channels. The deployment administrator must
                  populate <code className="rounded bg-surface-secondary px-1 text-foreground">VITE_SUPPORT_EMAIL</code>.
                </span>
              )}
            </p>
          </div>
        </div>
      </>
    ),
  },
]

export default function PrivacyPolicyPage() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState(sections[0].id)

  useEffect(() => {
    document.title = 'Privacy Policy | Chemistry Hub'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 font-bold group">
            <GscsLogo className="h-9 w-9 transition-transform group-hover:scale-105" />
            <div>
              <span className="block text-sm font-extrabold leading-none tracking-tight text-foreground">Chemistry Hub</span>
              <span className="block text-[10px] font-semibold text-muted-foreground mt-0.5">GSCS-KNUST</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover"
              >
                <ArrowLeft size={14} aria-hidden="true" /> Back to Portal
              </Link>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-surface-secondary"
              >
                <ArrowLeft size={14} aria-hidden="true" /> Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Scale size={13} aria-hidden="true" /> Republic of Ghana &bull; Act 843 Aligned
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Learn how Chemistry Hub collects, protects, processes, and respects your personal data in full compliance with
              the <strong>Data Protection Act, 2012 (Act 843)</strong> of the Republic of Ghana.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="text-primary" /> Effective: <strong className="text-foreground">{EFFECTIVE_DATE}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileCheck size={13} className="text-primary" /> Last updated: <strong className="text-foreground">{LAST_UPDATED_DATE}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout with Table of Contents */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Table of Contents (Sticky on Desktop) */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-20 rounded-2xl border border-border bg-surface p-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                <span>Table of Contents</span>
                <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] font-mono text-foreground">20 Sections</span>
              </h2>
              <nav aria-label="Privacy Policy Sections" className="max-h-[calc(100vh-160px)] overflow-y-auto space-y-1 text-xs pr-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-soft text-primary font-bold'
                          : 'text-muted-foreground hover:bg-surface-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon size={14} className="shrink-0" aria-hidden="true" />
                      <span className="truncate">{section.title}</span>
                    </a>
                  )
                })}
              </nav>

              <div className="mt-4 pt-3 border-t border-border">
                <Link
                  to="/terms"
                  className="flex items-center justify-between text-xs font-semibold text-primary hover:underline"
                >
                  <span>Terms of Use</span>
                  <ChevronRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Policy Sections */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-10">
            {/* Quick Summary Banner */}
            <div className="rounded-2xl border border-border bg-surface-secondary/40 p-5 text-xs text-muted-foreground leading-relaxed space-y-2">
              <strong className="text-sm font-bold text-foreground block">Key Privacy Commitments:</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                  <span>No advertising or behavioural tracking cookies</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                  <span>Memory-only session token handling</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                  <span>Row Level Security (RLS) database protections</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                  <span>Direct display-name correction in your profile</span>
                </div>
              </div>
            </div>

            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                tabIndex={-1}
                className="scroll-mt-24 rounded-2xl border border-border bg-surface p-6 shadow-xs transition-shadow hover:shadow-card focus:outline-none focus:ring-1 focus:ring-primary/20"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary shrink-0">
                    <section.icon size={16} aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight">{section.title}</h2>
                </div>
                <div className="mt-4 text-xs sm:text-sm leading-relaxed text-muted-foreground space-y-3">
                  {section.content}
                </div>
              </section>
            ))}

            {/* Quick Action Contact Card */}
            <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-surface to-surface-secondary/50 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shrink-0">
                  <HelpCircle size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Need to Exercise Your Privacy Rights?</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Submit an Access, Correction, or Deletion request to department administration.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {supportEmail ? (
                  <a
                    href={`mailto:${supportEmail}?subject=${encodeURIComponent('[Chemistry Hub Privacy Request] - Student ID / Request Type')}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-hover shadow-xs"
                  >
                    <Mail size={14} aria-hidden="true" /> Email Privacy Administrator
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground bg-surface border border-border px-3 py-2 rounded-xl">
                    Configure <code className="font-mono text-foreground font-semibold">VITE_SUPPORT_EMAIL</code> to enable direct one-click email requests.
                  </span>
                )}
                {user && (
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-surface-secondary"
                  >
                    <User size={14} aria-hidden="true" /> Edit My Profile Name
                  </Link>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-surface mt-16 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
          <p className="flex items-center justify-center gap-4 font-semibold text-primary mb-2">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <span aria-hidden="true">&bull;</span>
            <Link to="/terms" className="hover:underline">Terms of Use</Link>
            {user && (
              <>
                <span aria-hidden="true">&bull;</span>
                <Link to="/dashboard" className="hover:underline">Portal Dashboard</Link>
              </>
            )}
          </p>
          <p className="leading-relaxed">
            Chemistry Hub &bull; Ghana Students&rsquo; Chemical Society (GSCS) &bull; Department of Chemistry, KNUST, Kumasi, Ghana
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/80">
            Aligned with the Data Protection Act, 2012 (Act 843) of the Republic of Ghana.
          </p>
        </div>
      </footer>
    </div>
  )
}
