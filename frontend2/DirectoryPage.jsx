import React, { useEffect, useState, useMemo } from 'react'
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  Compass,
  Shield,
  Phone,
  Search,
  RefreshCw,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Info,
  X,
} from 'lucide-react'
import { DIRECTORY_CATEGORIES } from './directory/directoryConfig'
import { directoryApi } from './directory/directoryApi'
import StudentDirectoryModal from './directory/StudentDirectoryModal'

const TABS = [
  { key: 'executives', label: 'GSCS Executives', icon: Users, summaryKey: 'executives' },
  { key: 'classRepresentatives', label: 'Class Representatives', icon: UserCheck, summaryKey: 'class_representatives' },
  { key: 'lecturers', label: 'Lecturers & Faculty', icon: GraduationCap, summaryKey: 'lecturers' },
  { key: 'courses', label: 'Courses', icon: BookOpen, summaryKey: 'courses' },
  { key: 'clubs', label: 'Clubs & Societies', icon: Compass, summaryKey: 'clubs' },
  { key: 'committees', label: 'Committees', icon: Shield, summaryKey: 'committees' },
  { key: 'contacts', label: 'Offices & Contacts', icon: Phone, summaryKey: 'contacts' },
]

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function DirectoryPage() {
  const [activeTabKey, setActiveTabKey] = useState('executives')
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Data cache: key -> array of items
  const [cache, setCache] = useState({})
  const [summaryCounts, setSummaryCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const activeCategory = DIRECTORY_CATEGORIES[activeTabKey]

  // 1. Fetch directory summary for tab counters
  const fetchSummary = async () => {
    try {
      const summary = await directoryApi.getSummary()
      if (summary && typeof summary === 'object') {
        setSummaryCounts(summary)
      }
    } catch {
      // Non-fatal if summary fails
    }
  }

  // 2. Fetch records for active category
  const loadCategoryData = async (catKey, forceRefresh = false) => {
    const config = DIRECTORY_CATEGORIES[catKey]
    if (!config) return

    if (!forceRefresh && cache[catKey]) {
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await directoryApi.listEntities(config.endpoint, { is_active: true, limit: 100 })
      const items = Array.isArray(res) ? res : res?.items || []
      setCache((prev) => ({ ...prev, [catKey]: items }))
    } catch (err) {
      console.error('Unable to load directory data:', err)
      setError('Unable to load directory data right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load summary on mount
  useEffect(() => {
    fetchSummary()
  }, [])

  // Load data when active tab changes
  useEffect(() => {
    loadCategoryData(activeTabKey)
    setLevelFilter('All')
    setCategoryFilter('All')
  }, [activeTabKey])

  const handleRefresh = () => {
    fetchSummary()
    loadCategoryData(activeTabKey, true)
  }

  const handleOpenRecord = (record) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  // Filter items in active tab
  const rawItems = cache[activeTabKey] || []

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return rawItems.filter((item) => {
      // Level filter
      if (levelFilter !== 'All') {
        if (item.level && String(item.level) !== levelFilter) return false
      }

      // Category filter (clubs / contacts)
      if (categoryFilter !== 'All') {
        if (item.category && item.category !== categoryFilter) return false
      }

      // Search filter
      if (!q) return true

      const searchableFields = [
        item.name,
        item.course_name,
        item.course_code,
        item.position,
        item.role,
        item.class_name,
        item.program,
        item.specialization,
        item.qualification,
        item.office,
        item.location,
        item.email,
        item.contact_email,
        item.phone,
        item.contact_phone,
        item.bio,
        item.description,
        item.purpose,
        item.acronym,
      ]

      return searchableFields.some(
        (field) => field && String(field).toLowerCase().includes(q)
      )
    })
  }, [rawItems, searchQuery, levelFilter, categoryFilter])

  // Available filter options
  const hasLevelFilter = ['executives', 'classRepresentatives', 'courses'].includes(activeTabKey)
  const hasCategoryFilter = ['clubs', 'contacts'].includes(activeTabKey)

  const clubCategories = ['All', 'Academic', 'Professional', 'Research', 'Social', 'Outreach']
  const contactCategories = ['All', 'Administration', 'Laboratory', 'Emergency', 'Library', 'Academic Support']

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            PEOPLE & DIRECTORY
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-1">Department Directory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Connect with student executives, class reps, faculty, course instructors, and campus offices.
          </p>
        </div>

        {/* Search & Refresh Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-72 relative">
            <Search className="absolute left-3 top-2.5 text-[#9ba8ac]" size={14} />
            <input
              type="text"
              aria-label={`Search ${activeCategory?.plural || 'directory'}`}
              placeholder={`Search ${activeCategory?.plural || 'directory'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#9ba8ac] hover:text-foreground text-xs font-bold"
                aria-label="Clear directory search"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            onClick={handleRefresh}
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-border bg-surface text-[#65767b] hover:text-primary hover:bg-[#f3f8f9] transition-colors shadow-xs"
            title="Refresh directory records"
            aria-label="Refresh directory records"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── CATEGORY TABS ───────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTabKey === tab.key
          const Icon = tab.icon
          const count = summaryCounts[tab.summaryKey]

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTabKey(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface text-muted-foreground border border-border hover:border-[var(--primary-border)] hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#eef5f6] text-primary'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── SECONDARY FILTER PILLS ──────────────────────────────── */}
      {(hasLevelFilter || hasCategoryFilter) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-[#86999e] uppercase tracking-wider">
            Filter:
          </span>

          {hasLevelFilter && (
            <div className="flex gap-1.5 flex-wrap">
              {['All', '100', '200', '300', '400'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    levelFilter === lvl
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface text-[#667a80] border border-border hover:bg-[#f6f9fa]'
                  }`}
                >
                  {lvl === 'All' ? 'All Levels' : `Level ${lvl}`}
                </button>
              ))}
            </div>
          )}

          {hasCategoryFilter && (
            <div className="flex gap-1.5 flex-wrap">
              {(activeTabKey === 'clubs' ? clubCategories : contactCategories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    categoryFilter === cat
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface text-[#667a80] border border-border hover:bg-[#f6f9fa]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ERROR STATE ─────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-[var(--destructive-soft)] border border-[var(--destructive-border)] rounded-2xl flex items-center justify-between gap-3 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-surface text-destructive rounded-lg font-bold border border-[var(--destructive-border)] hover:bg-red-50 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── LOADING SKELETON ────────────────────────────────────── */}
      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-2xl p-6 shadow-xs animate-pulse flex flex-col items-center justify-between min-h-[220px]"
            >
              <div className="w-16 h-16 rounded-full bg-gray-200 mb-3" />
              <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
              <div className="w-24 h-3 bg-gray-200 rounded mb-4" />
              <div className="w-full h-8 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* ── EMPTY STATE ─────────────────────────────────────────── */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="py-16 text-center text-xs text-muted-foreground bg-surface rounded-2xl border border-border shadow-xs px-4">
          <div className="w-12 h-12 rounded-full bg-[#f1f6f7] text-primary font-black text-xl grid place-items-center mx-auto mb-3">
            ⌕
          </div>
          <strong className="block text-sm font-bold text-foreground mb-1">
            No contacts or records found
          </strong>
          <p className="max-w-md mx-auto text-[11px] text-muted-foreground leading-relaxed">
            {searchQuery
              ? `No results match "${searchQuery}" under ${activeCategory?.plural || 'this category'}. Try changing keywords.`
              : `No published records currently listed under ${activeCategory?.plural || 'this category'}.`}
          </p>
          {(searchQuery || levelFilter !== 'All' || categoryFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setLevelFilter('All')
                setCategoryFilter('All')
              }}
              className="mt-4 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* ── DIRECTORY CARDS GRID ────────────────────────────────── */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const photoUrl = item.photo_url || item.logo_url
            const email = item.email || item.contact_email
            const phone = item.phone || item.contact_phone

            // Custom content per category
            if (activeTabKey === 'lecturers') {
              const displayName = `${item.title ? `${item.title} ` : ''}${item.name}`
              return (
                <article
                  key={item.id}
                  className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[var(--primary-border)] transition-all group"
                >
                  <div className="text-center">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={displayName}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#dceff0] text-primary font-black text-lg grid place-items-center mx-auto mb-3">
                        {getInitials(item.name) || 'DR'}
                      </div>
                    )}

                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {displayName}
                    </h3>
                    <p className="text-xs font-semibold text-primary mt-0.5 line-clamp-1">
                      {item.specialization || 'Lecturer & Researcher'}
                    </p>
                    {item.office && (
                      <small className="text-[11px] text-[#7e9499] block mt-1 flex items-center justify-center gap-1">
                        <MapPin size={11} /> {item.office}
                      </small>
                    )}
                    {item.bio && (
                      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {item.bio}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f1f5f6] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenRecord(item)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-[var(--primary-soft)] text-primary text-[11px] font-bold hover:bg-[#d6f0f2] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Clock size={12} /> Consultation Hours
                    </button>
                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="w-9 h-9 rounded-full bg-surface-secondary text-[#5c7277] hover:bg-primary hover:text-white grid place-items-center text-xs transition-colors"
                        title={`Email ${displayName}`}
                        aria-label={`Email ${displayName}`}
                      >
                        <Mail size={13} />
                      </a>
                    )}
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="w-9 h-9 rounded-full bg-surface-secondary text-[#5c7277] hover:bg-primary hover:text-white grid place-items-center text-xs transition-colors"
                        title={`Call ${displayName}`}
                        aria-label={`Call ${displayName}`}
                      >
                        <Phone size={13} />
                      </a>
                    )}
                  </div>
                </article>
              )
            }

            if (activeTabKey === 'courses') {
              return (
                <article
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${item.course_code} ${item.course_name}`}
                  onClick={() => handleOpenRecord(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleOpenRecord(item)
                    }
                  }}
                  className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[var(--primary-border)] cursor-pointer transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[var(--primary-soft)] text-primary text-xs font-black">
                        {item.course_code}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 text-[#546e74]">
                        Level {item.level || '—'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.course_name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                      {item.description || 'No syllabus description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f1f5f6] flex items-center justify-between text-[11px] text-[#748c92]">
                    <span>{item.credit_hours ? `${item.credit_hours} Credits` : 'Credit Units'}</span>
                    <span className="font-bold text-primary group-hover:underline flex items-center gap-1">
                      Details <ChevronRight size={13} />
                    </span>
                  </div>
                </article>
              )
            }

            if (activeTabKey === 'clubs') {
              return (
                <article
                  key={item.id}
                  className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[var(--primary-border)] transition-all group"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="w-12 h-12 rounded-xl object-cover border border-border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#eef7f8] text-primary font-black text-sm grid place-items-center flex-shrink-0">
                          {item.acronym || getInitials(item.name) || 'CS'}
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-primary bg-[#e7f5f7] px-2 py-0.5 rounded">
                          {item.category || 'Society'}
                        </span>
                        <h3 className="text-sm font-bold text-foreground mt-1 group-hover:text-primary transition-colors leading-snug">
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">
                      {item.description || 'Active student society in the Department of Chemistry.'}
                    </p>

                    {(item.meeting_day || item.meeting_location) && (
                      <div className="mt-2 text-[10px] text-[#71888e] flex items-center gap-1.5">
                        <Clock size={11} className="text-primary" />
                        <span>
                          {item.meeting_day ? `${item.meeting_day}s` : 'Meetings'}
                          {item.meeting_location ? ` · ${item.meeting_location}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f1f5f6] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenRecord(item)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      View Club Info →
                    </button>
                    <div className="flex items-center gap-1.5">
                      {email && (
                        <a
                          href={`mailto:${email}`}
                          className="w-9 h-9 rounded-full bg-surface-secondary text-[#5c7277] hover:bg-primary hover:text-white grid place-items-center text-xs transition-colors"
                          title="Email Club"
                          aria-label={`Email ${item.name}`}
                        >
                          <Mail size={12} />
                        </a>
                      )}
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="w-9 h-9 rounded-full bg-surface-secondary text-[#5c7277] hover:bg-primary hover:text-white grid place-items-center text-xs transition-colors"
                          title="Call Contact"
                          aria-label={`Call ${item.name}`}
                        >
                          <Phone size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              )
            }

            if (activeTabKey === 'committees') {
              return (
                <article
                  key={item.id}
                  className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[var(--primary-border)] transition-all group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-[#e7f5f7] text-primary grid place-items-center">
                        <Shield size={14} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase text-[#7a8f94]">
                        AY {item.academic_year || 'Active'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {item.name}
                    </h3>

                    {item.chairperson && (
                      <p className="text-[11px] text-[#4b6369] mt-2">
                        <span className="text-[#899ca1]">Chair:</span> <strong>{item.chairperson}</strong>
                      </p>
                    )}

                    {item.purpose && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                        {item.purpose}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f1f5f6] flex items-center justify-between">
                    <button
                      onClick={() => handleOpenRecord(item)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--primary-soft)] text-primary text-xs font-bold hover:bg-[#d5eef1] transition-colors"
                    >
                      View Members Roster →
                    </button>
                  </div>
                </article>
              )
            }

            if (activeTabKey === 'contacts') {
              return (
                <article
                  key={item.id}
                  className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[var(--primary-border)] transition-all group"
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#f1f5f6] text-[#4b6267] mb-2 inline-block">
                      {item.category || 'Office'}
                    </span>

                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {item.name}
                    </h3>

                    {item.role && (
                      <p className="text-xs font-semibold text-primary mt-0.5">
                        {item.role}
                      </p>
                    )}

                    {(item.office || item.location) && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <MapPin size={11} className="flex-shrink-0" />
                        <span>{item.office || item.location}</span>
                      </p>
                    )}

                    {item.description && (
                      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f1f5f6] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenRecord(item)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Operating Info →
                    </button>
                    <div className="flex items-center gap-1.5">
                      {email && (
                        <a
                          href={`mailto:${email}`}
                          className="w-9 h-9 rounded-full bg-surface-secondary text-[#5c7277] hover:bg-primary hover:text-white grid place-items-center text-xs transition-colors"
                          title="Send Email"
                          aria-label={`Email ${item.name}`}
                        >
                          <Mail size={12} />
                        </a>
                      )}
                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="w-9 h-9 rounded-full bg-surface-secondary text-[#5c7277] hover:bg-primary hover:text-white grid place-items-center text-xs transition-colors"
                          title="Call Phone"
                          aria-label={`Call ${item.name}`}
                        >
                          <Phone size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              )
            }

            // Default for Executives & Class Representatives
            const subtitle =
              item.position ||
              (item.class_name ? `${item.class_name}` : 'Student Representative')
            const metaInfo = item.program
              ? `Level ${item.level || ''} · ${item.program}`
              : item.level
              ? `Level ${item.level}`
              : item.academic_year || ''

            return (
              <article
                key={item.id}
                className="bg-surface border border-border rounded-2xl p-6 text-center shadow-xs flex flex-col items-center justify-between hover:border-[var(--primary-border)] transition-all group"
              >
                <div className="w-full">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#dceff0] text-primary font-black text-lg grid place-items-center mx-auto mb-3 shadow-2xs">
                      {getInitials(item.name)}
                    </div>
                  )}

                  <h3 className="text-base font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors break-words">
                    {item.name}
                  </h3>
                  <p className="text-xs font-bold text-primary mb-1 break-words">
                    {subtitle}
                  </p>
                  <small className="text-[11px] text-[#8a999d] block break-words">
                    {metaInfo}
                  </small>

                  {item.bio && (
                    <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {item.bio}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 mt-5 pt-3 border-t border-[#f4f7f8] w-full">
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="w-9 h-9 rounded-full bg-[#f2f6f6] text-[#667a7f] hover:bg-[var(--primary-soft)] hover:text-primary grid place-items-center text-xs transition-colors"
                      title={`Email ${item.name}`}
                      aria-label={`Email ${item.name}`}
                    >
                      <Mail size={13} />
                    </a>
                  )}
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="w-9 h-9 rounded-full bg-[#f2f6f6] text-[#667a7f] hover:bg-[var(--primary-soft)] hover:text-primary grid place-items-center text-xs transition-colors"
                      title={`Call ${item.name}`}
                      aria-label={`Call ${item.name}`}
                    >
                      <Phone size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => handleOpenRecord(item)}
                    className="w-9 h-9 rounded-full bg-[#f2f6f6] text-[#667a7f] hover:bg-[var(--primary-soft)] hover:text-primary grid place-items-center text-xs transition-colors font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    title="View details"
                    aria-label={`View details for ${item.name}`}
                  >
                    <Info size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* ── CONSULTATION & NOTICE BANNER ────────────────────────── */}
      <div className="bg-[#eef8f9] border border-[#d9edef] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <strong className="block text-xs font-bold text-[#086873]">
            Lecturer consultation hours & Department Contacts
          </strong>
          <p className="text-xs text-[#4e7177] mt-1 leading-relaxed max-w-2xl">
            Faculty members keep their weekly office and virtual consultation slots updated here.
            Click on any lecturer card to see their consultation schedule and instructions before visiting.
          </p>
        </div>
        <button
          onClick={() => setActiveTabKey('lecturers')}
          className="px-3.5 py-2 rounded-xl bg-surface border border-[var(--primary-border)] text-primary text-xs font-bold hover:bg-[#e3f4f6] transition-colors whitespace-nowrap"
        >
          View Lecturers →
        </button>
      </div>

      {/* ── STUDENT DETAILS MODAL ──────────────────────────────── */}
      <StudentDirectoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryKey={activeTabKey}
        record={selectedRecord}
      />
    </div>
  )
}
