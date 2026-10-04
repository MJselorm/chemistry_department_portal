import React, { useEffect, useState, useCallback } from 'react'
import { CalendarDays, Clock, MapPin, RefreshCw, Search, Users, Mail, ExternalLink, Sparkles } from 'lucide-react'
import { api } from './client'
import { ENDPOINTS } from './endpoints'

const EVENT_TYPES = ['All', 'Seminar', 'Workshop', 'Conference', 'Social']

const formatEventDate = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

const formatEventTimeRange = (startIso, endIso) => {
  if (!startIso) return ''
  const start = new Date(startIso)
  const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (!endIso) return startTime
  const end = new Date(endIso)
  const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${startTime} – ${endTime}`
}

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' })
      if (search.trim()) params.set('search', search.trim())
      if (selectedType !== 'All') params.set('event_type', selectedType)
      const result = await api.get(`${ENDPOINTS.events}?${params}`)
      setEvents(result.items || [])
    } catch (err) {
      setError(err.message || 'Unable to load events from the department server.')
    } finally {
      setLoading(false)
    }
  }, [search, selectedType])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadEvents()
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
            DEPARTMENT CALENDAR
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-1">Events & Seminars</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Discover upcoming departmental lectures, student seminars, workshops, and research conferences.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full sm:w-72 relative">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={14} aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title or topic…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:border-primary shadow-xs"
          />
        </form>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                selectedType === type
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface border border-border text-muted-foreground hover:border-[var(--primary-border)]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={loadEvents}
          disabled={loading}
          className="p-2 rounded-xl border border-border bg-surface text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 text-xs font-medium"
          aria-label="Refresh events"
          title="Refresh events"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-[var(--destructive-soft)] border border-[var(--destructive-border)] text-destructive text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadEvents} className="font-bold underline ml-3">
            Retry
          </button>
        </div>
      )}

      {/* Event List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">Loading calendar events…</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center bg-surface border border-border rounded-2xl p-8 space-y-2">
          <CalendarDays size={36} className="text-muted-foreground mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-foreground">No events found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || selectedType !== 'All'
              ? 'No scheduled events match your current filter or search criteria.'
              : 'There are no published events on the department calendar right now. Please check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map((event) => {
            const startDate = new Date(event.start_datetime)
            const dayNum = startDate.getDate()
            const monthStr = startDate.toLocaleString([], { month: 'short' }).toUpperCase()

            return (
              <article
                key={event.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-sm hover:border-[var(--primary-border)] hover:shadow-md transition-all group"
              >
                {/* Date Badge */}
                <div className="w-full sm:w-24 bg-primary text-white flex sm:flex-col items-center justify-between sm:justify-center p-3 text-center shrink-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">{monthStr}</span>
                  <strong className="text-2xl font-black leading-tight sm:my-0.5">{dayNum}</strong>
                  <span className="text-[10px] opacity-75">{startDate.getFullYear()}</span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[var(--primary-soft)] text-primary">
                        {event.event_type || 'Event'}
                      </span>
                      {event.department && (
                        <span className="text-[10px] text-muted-foreground">
                          · {event.department}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {event.title}
                    </h2>

                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">
                      {event.description || 'Details and agenda for this event will be communicated by the organizers.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} className="text-primary" />
                        {formatEventTimeRange(event.start_datetime, event.end_datetime)}
                      </span>
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} className="text-primary" />
                          {event.location}
                        </span>
                      )}
                      {event.capacity && (
                        <span className="inline-flex items-center gap-1">
                          <Users size={13} />
                          Cap: {event.capacity}
                        </span>
                      )}
                    </div>

                    {event.registration_url && (
                      <div className="pt-1">
                        <a
                          href={event.registration_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
                        >
                          <span>Register / Join Session</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
