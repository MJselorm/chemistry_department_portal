import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Users,
  UserCheck,
  BookOpen,
  Compass,
  Shield,
  Layers,
  Phone,
  ArrowRight,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react'
import { directoryApi } from './directoryApi'
import DirectorySubNav from './DirectorySubNav'

export default function DirectoryAdminOverview() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Live search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchContainerRef = useRef(null)

  const loadSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await directoryApi.getSummary()
      setSummary(data || {})
    } catch (err) {
      setError(err?.message || 'Failed to load directory metrics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  // Handle live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      setSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await directoryApi.search(searchQuery.trim())
        setSearchResults(results)
        setShowResults(true)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cards = [
    {
      key: 'lecturers',
      title: 'Lecturers',
      count: summary?.lecturers ?? 0,
      subnote: `${summary?.lecturers ?? 0} active teaching`,
      icon: Briefcase,
      route: '/admin/directory/lecturers',
    },
    {
      key: 'executives',
      title: 'Executives',
      count: summary?.executives ?? 0,
      subnote: `${summary?.executives ?? 0} active cabinet`,
      icon: Users,
      route: '/admin/directory/executives',
    },
    {
      key: 'classRepresentatives',
      title: 'Class Representatives',
      count: summary?.class_representatives ?? 0,
      subnote: `${summary?.class_representatives ?? 0} active representatives`,
      icon: UserCheck,
      route: '/admin/directory/class-representatives',
    },
    {
      key: 'courses',
      title: 'Courses',
      count: summary?.courses ?? 0,
      subnote: `${summary?.courses ?? 0} published syllabus`,
      icon: BookOpen,
      route: '/admin/directory/courses',
    },
    {
      key: 'clubs',
      title: 'Clubs',
      count: summary?.clubs ?? 0,
      subnote: `${summary?.clubs ?? 0} active campus groups`,
      icon: Compass,
      route: '/admin/directory/clubs',
    },
    {
      key: 'committees',
      title: 'Committees',
      count: summary?.committees ?? 0,
      subnote: `${summary?.committees ?? 0} active assemblies`,
      icon: Shield,
      route: '/admin/directory/committees',
    },
    {
      key: 'departments',
      title: 'Departments',
      count: summary?.departments ?? 0,
      subnote: 'All active programs',
      icon: Layers,
      route: '/admin/directory/departments',
    },
    {
      key: 'contacts',
      title: 'Contacts',
      count: summary?.contacts ?? 0,
      subnote: `${summary?.contacts ?? 0} visible directory numbers`,
      icon: Phone,
      route: '/admin/directory/contacts',
    },
  ]

  const quickActions = [
    { label: 'Add Lecturer', route: '/admin/directory/lecturers?action=new' },
    { label: 'Add Executive', route: '/admin/directory/executives?action=new' },
    { label: 'Add Class Rep', route: '/admin/directory/class-representatives?action=new' },
    { label: 'Add Course', route: '/admin/directory/courses?action=new' },
    { label: 'Add Club', route: '/admin/directory/clubs?action=new' },
    { label: 'Add Committee', route: '/admin/directory/committees?action=new' },
    { label: 'Add Department', route: '/admin/directory/departments?action=new' },
    { label: 'Add Contact', route: '/admin/directory/contacts?action=new' },
  ]

  const totalSearchResultsCount = searchResults
    ? Object.values(searchResults).reduce((acc, arr) => acc + (arr?.length || 0), 0)
    : 0

  return (
    <div className="space-y-8">
      {/* Top Search & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="text-xs text-[#8fa0a4] mb-1">
            <span>Home</span> / <span className="text-foreground font-semibold">Dashboard</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Directory Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Manage the information students see across the department. Control access roles, update courses, and publish contacts.
          </p>
        </div>

        {/* Global Live Search Bar */}
        <div ref={searchContainerRef} className="relative w-full sm:w-80 flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-3 text-[#9ba8ac]" />
            <input
              type="text"
              placeholder="Search directories, courses..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-surface text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-xs transition-all"
            />
            {searching && (
              <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-primary" />
            )}
          </div>

          {/* Search Dropdown Results */}
          {showResults && searchResults && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-surface rounded-2xl border border-border shadow-card z-50 max-h-96 overflow-y-auto p-3 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2 border-b border-[#f0f4f5] pb-2">
                <span>Search results ({totalSearchResultsCount})</span>
                <button
                  onClick={() => setShowResults(false)}
                  className="hover:text-foreground font-bold"
                  aria-label="Close search results"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>

              {totalSearchResultsCount === 0 ? (
                <p className="text-xs text-[#8fa0a4] p-3 text-center">
                  No matching records found for "{searchQuery}".
                </p>
              ) : (
                Object.entries(searchResults).map(([groupKey, groupItems]) => {
                  if (!groupItems || groupItems.length === 0) return null
                  return (
                    <div key={groupKey} className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8da0a5] px-2 block">
                        {groupKey}
                      </span>
                      {groupItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setShowResults(false)
                            navigate(`/admin/directory/${groupKey.replace('_', '-')}`)
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-[#f2f7f8] flex items-center justify-between transition-colors text-xs group"
                        >
                          <div>
                            <strong className="block text-xs text-foreground group-hover:text-primary">
                              {item.name || item.course_name || item.code}
                            </strong>
                            <small className="text-[10px] text-[#788a8f]">
                              {item.position || item.course_code || item.role || item.location || ''}
                            </small>
                          </div>
                          <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">
                            View →
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Directory Category Navigation Tabs */}
      <DirectorySubNav />

      {/* Directory Overview Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Directory Overview</h2>
          <button
            onClick={loadSummary}
            disabled={loading}
            className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh metrics
          </button>
        </div>

        {/* 3x3 Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <article
                key={card.key}
                className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-[var(--primary-border)] transition-all flex flex-col justify-between group"
              >
                {/* Card Top: Icon & Manage link */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#e6f7f8] text-primary grid place-items-center transition-colors group-hover:bg-primary group-hover:text-white shadow-xs">
                    <Icon size={20} />
                  </div>

                  <Link
                    to={card.route}
                    className="text-xs font-bold text-primary hover:text-[#05636d] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Manage <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Card Bottom: Big Count, Label, and Subnote */}
                <div className="mt-5">
                  <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight block">
                    {loading ? (
                      <span className="inline-block w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
                    ) : (
                      card.count
                    )}
                  </span>
                  <strong className="text-sm font-bold text-foreground block mt-1">
                    {card.title}
                  </strong>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#27805a]" />
                    <span>{card.subnote}</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="space-y-3 pt-2">
        <h2 className="text-base font-bold text-foreground">Quick Actions</h2>

        <div className="flex flex-wrap items-center gap-2.5">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.route}
              className="px-4 py-2.5 rounded-xl border border-border bg-surface hover:border-primary hover:bg-[#f5fbfb] hover:text-primary text-xs font-bold text-foreground flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus size={14} className="text-primary" />
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
