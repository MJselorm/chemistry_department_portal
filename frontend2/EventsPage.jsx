import React, { useState } from 'react'
import { CalendarPlus, Camera, Check, Clock, MapPin, QrCode, X } from 'lucide-react'
import { MOCK_EVENTS } from './mocks'

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [checkInCode, setCheckInCode] = useState('')
  const [checkInStatus, setCheckInStatus] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [registeredIds, setRegisteredIds] = useState({})

  const filters = ['All', 'Seminars', 'Workshops', 'Conferences', 'Social']

  const filteredEvents = activeFilter === 'All'
    ? MOCK_EVENTS
    : MOCK_EVENTS.filter((e) => e.category.toLowerCase() === activeFilter.toLowerCase())

  const handleRegister = (event) => {
    setRegisteredIds((prev) => ({ ...prev, [event.id]: true }))
    alert(`Successfully registered for "${event.title}"! (Placeholder API: POST /events/${event.id}/register)`)
  }

  const handleCheckIn = (e) => {
    e.preventDefault()
    if (!checkInCode.trim()) return
    setCheckInStatus({
      success: true,
      message: `Checked in code "${checkInCode.trim().toUpperCase()}" successfully! (Placeholder API: POST /events/checkin)`
    })
    setCheckInCode('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">DEPARTMENT CALENDAR</span>
          <h1 className="text-2xl font-bold text-foreground mt-1">Events & seminars</h1>
          <p className="text-xs text-muted-foreground mt-1">Discover seminars, workshops, conferences and student activities.</p>
        </div>
        <button
          onClick={() => alert('Add to calendar feature (Placeholder: iCal / Google Calendar export)')}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold self-start sm:self-auto transition-colors inline-flex items-center gap-2"
        >
          <CalendarPlus size={14} aria-hidden="true" />
          Add to calendar
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              activeFilter === f
                ? 'bg-primary border-primary text-white'
                : 'bg-surface border-border text-[#718287] hover:border-[var(--primary-border)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredEvents.map((evt) => {
          const isRegistered = registeredIds[evt.id]
          return (
            <article
              key={evt.id}
              className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Date Badge */}
              <div
                className={`w-full sm:w-24 text-white flex sm:flex-col items-center justify-center p-3 gap-2 sm:gap-0 flex-shrink-0 ${
                  evt.badgeColor === 'green'
                    ? 'bg-[#27805a]'
                    : evt.badgeColor === 'amber'
                    ? 'bg-[#a66b08]'
                    : 'bg-primary'
                }`}
              >
                <span className="text-[10px] font-extrabold tracking-widest">{evt.month}</span>
                <strong className="text-2xl sm:text-3xl font-black">{evt.day}</strong>
                <small className="text-[10px] opacity-75">{evt.year}</small>
              </div>

              {/* Event Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[var(--primary-soft)] text-primary">
                    {evt.badge}
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-1.5 mb-1">{evt.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{evt.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-[#74878b] font-medium my-3">
                    <span className="inline-flex items-center gap-1.5"><Clock size={13} aria-hidden="true" />{evt.time}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin size={13} aria-hidden="true" />{evt.venue}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-[#f4f7f8]">
                  <button
                    onClick={() => handleRegister(evt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isRegistered
                        ? 'bg-[var(--success-soft)] text-success border border-[var(--success-border)]'
                        : 'bg-primary hover:bg-primary-hover text-white'
                    }`}
                  >
                    {isRegistered ? (
                      <span className="inline-flex items-center gap-1.5"><Check size={13} aria-hidden="true" />Registered</span>
                    ) : (
                      'Register'
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedEvent(evt)}
                    className="px-3 py-1.5 rounded-lg border border-[#d7e2e4] text-muted-foreground text-xs font-bold hover:bg-gray-50 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Attendance & Event Check-in Section */}
      <section className="bg-surface border border-border rounded-2xl p-6 shadow-sm" id="checkin">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">ATTENDANCE</span>
            <h2 className="text-xl font-bold text-foreground">Event check-in</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
              Scan the QR code displayed by the event coordinator or enter your attendance code to record your participation.
            </p>

            <form onSubmit={handleCheckIn} className="flex gap-2 max-w-md pt-2">
              <input
                type="text"
                placeholder="e.g. CHM-204"
                value={checkInCode}
                onChange={(e) => setCheckInCode(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors"
              >
                Check in
              </button>
            </form>

            {checkInStatus && (
              <div className="p-3 rounded-xl bg-[var(--success-soft)] border border-[var(--success-border)] text-success text-xs font-medium max-w-md">
                {checkInStatus.message}
              </div>
            )}
          </div>

          {/* QR Box */}
          <div className="border-2 border-dashed border-[#dce7e8] rounded-xl p-6 bg-[#f8fbfb] flex flex-col items-center justify-center text-center">
            <QrCode className="text-[#8da0a4] mb-1" size={40} aria-hidden="true" />
            <strong className="text-xs font-bold text-[#53676b]">QR Scanner</strong>
            <small className="text-[10px] text-[#8da0a4] mb-3">Camera integration ready for backend</small>
            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className="px-3 py-1.5 rounded-lg border border-[#d7e2e4] text-xs font-bold text-muted-foreground hover:bg-surface transition-colors"
            >
              {isCameraActive ? 'Disable camera' : 'Activate camera'}
            </button>
            {isCameraActive && (
              <div className="mt-3 p-3 bg-black text-white text-[10px] rounded-lg w-full text-center">
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Camera size={13} aria-hidden="true" />
                  Camera scanning active (Mock Feed)
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-border relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 grid place-items-center text-gray-500 hover:bg-gray-200"
              aria-label="Close event details"
            >
              <X size={16} aria-hidden="true" />
            </button>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-[var(--primary-soft)] text-primary">
              {selectedEvent.badge}
            </span>
            <h2 className="text-2xl font-extrabold text-foreground mt-2 mb-2">{selectedEvent.title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">{selectedEvent.description}</p>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border text-xs">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">DATE & TIME</span>
                <strong className="font-bold text-foreground block mt-0.5">
                  {selectedEvent.month} {selectedEvent.day}, {selectedEvent.year} · {selectedEvent.time}
                </strong>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">VENUE</span>
                <strong className="font-bold text-foreground block mt-0.5">{selectedEvent.venue}</strong>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">ORGANIZER</span>
                <strong className="font-bold text-foreground block mt-0.5">{selectedEvent.organizer}</strong>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">CAPACITY</span>
                <strong className="font-bold text-foreground block mt-0.5">{selectedEvent.capacity}</strong>
              </div>
            </div>

            <div className="my-5">
              <h4 className="text-xs font-bold text-foreground mb-1">About this event</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{selectedEvent.details}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleRegister(selectedEvent)
                  setSelectedEvent(null)
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors"
              >
                Register for event
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2.5 rounded-xl border border-[#d7e2e4] text-muted-foreground text-xs font-bold hover:bg-gray-50"
              >
                Return to events
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
