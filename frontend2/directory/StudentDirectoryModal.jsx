import React, { useEffect, useState } from 'react'
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  BookOpen,
  ExternalLink,
  Shield,
  Users,
  Copy,
  Check,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react'
import { directoryApi } from './directoryApi'

/**
 * Formats "HH:MM:SS" or "HH:MM" into "10:00 AM" format.
 */
function formatTime(timeStr) {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function StudentDirectoryModal({
  isOpen,
  onClose,
  categoryKey,
  record,
}) {
  const [copiedField, setCopiedField] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [loadingConsultations, setLoadingConsultations] = useState(false)
  const [committeeMembers, setCommitteeMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Copy to clipboard helper
  const handleCopy = (text, fieldKey) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldKey)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Load consultations if lecturer
  useEffect(() => {
    if (isOpen && categoryKey === 'lecturers' && record?.id) {
      setLoadingConsultations(true)
      directoryApi
        .listConsultations(record.id)
        .then((res) => {
          const items = Array.isArray(res) ? res : res?.items || []
          setConsultations(items)
        })
        .catch(() => setConsultations([]))
        .finally(() => setLoadingConsultations(false))
    } else {
      setConsultations([])
    }
  }, [isOpen, categoryKey, record?.id])

  // Load committee members if committee
  useEffect(() => {
    if (isOpen && categoryKey === 'committees' && record?.id) {
      setLoadingMembers(true)
      directoryApi
        .listCommitteeMembers(record.id)
        .then((res) => {
          const items = Array.isArray(res) ? res : res?.items || []
          setCommitteeMembers(items)
        })
        .catch(() => setCommitteeMembers([]))
        .finally(() => setLoadingMembers(false))
    } else {
      setCommitteeMembers([])
    }
  }, [isOpen, categoryKey, record?.id])

  if (!isOpen || !record) return null

  const displayName =
    categoryKey === 'lecturers'
      ? `${record.title ? `${record.title} ` : ''}${record.name}`
      : record.name || record.course_name || 'Details'

  const subtitle =
    categoryKey === 'executives'
      ? record.position
      : categoryKey === 'classRepresentatives'
      ? `${record.class_name || 'Class Representative'} · Level ${record.level || ''}`
      : categoryKey === 'lecturers'
      ? record.specialization || 'Lecturer & Researcher'
      : categoryKey === 'courses'
      ? `${record.course_code} · ${record.semester || ''} (Level ${record.level || ''})`
      : categoryKey === 'clubs'
      ? record.acronym ? `${record.acronym} · ${record.category || 'Student Club'}` : record.category
      : categoryKey === 'committees'
      ? `Academic Year ${record.academic_year || 'Active'}`
      : record.role || record.category || 'Department Office'

  const photoUrl = record.photo_url || record.logo_url
  const email = record.email || record.contact_email
  const phone = record.phone || record.contact_phone

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-surface rounded-2xl border border-border shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eef2f3] bg-surface-secondary">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#73888d]">
              Directory Profile
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[#6b7f84] hover:bg-[#f1f6f7] hover:text-foreground grid place-items-center transition-colors"
            title="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile Overview Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-20 h-20 rounded-2xl object-cover border border-border shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#dff2f4] to-[#c2e7ea] text-primary font-black text-2xl grid place-items-center flex-shrink-0 shadow-xs">
                {getInitials(displayName) || 'CH'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground leading-snug break-words">
                {displayName}
              </h2>
              <p className="text-xs font-bold text-primary mt-0.5 break-words">
                {subtitle}
              </p>

              {/* Badges / Meta row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                {record.level && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#eaf4f6] text-primary">
                    Level {record.level}
                  </span>
                )}
                {record.credit_hours && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#eef7ed] text-[#2d8157]">
                    {record.credit_hours} Credits
                  </span>
                )}
                {record.office && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-[#4c6267] flex items-center gap-1">
                    <MapPin size={11} /> {record.office}
                  </span>
                )}
                {record.location && !record.office && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-[#4c6267] flex items-center gap-1">
                    <MapPin size={11} /> {record.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Contact Action Buttons */}
          {(email || phone || record.website || record.social_links) && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#f1f5f6]">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
                >
                  <Mail size={14} /> Send Email
                </a>
              )}

              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#d6e3e5] bg-surface text-foreground text-xs font-bold hover:bg-[#f8fbfb] transition-colors"
                >
                  <Phone size={14} /> Call
                </a>
              )}

              {phone && (
                <button
                  onClick={() => handleCopy(phone, 'phone')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#d6e3e5] bg-surface text-[#5b7176] text-xs font-semibold hover:bg-[#f8fbfb] transition-colors"
                  title="Copy Phone Number"
                >
                  {copiedField === 'phone' ? (
                    <>
                      <Check size={14} className="text-success" />
                      <span className="text-success">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>{phone}</span>
                    </>
                  )}
                </button>
              )}

              {record.website && (
                <a
                  href={record.website.startsWith('http') ? record.website : `https://${record.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#d6e3e5] bg-surface text-primary text-xs font-bold hover:bg-[#f8fbfb] transition-colors"
                >
                  <ExternalLink size={13} /> Website
                </a>
              )}

              {record.social_links && (
                <a
                  href={record.social_links.startsWith('http') ? record.social_links : `https://${record.social_links}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#d6e3e5] bg-surface text-primary text-xs font-bold hover:bg-[#f8fbfb] transition-colors"
                >
                  <ExternalLink size={13} /> Social Link
                </a>
              )}
            </div>
          )}

          {/* Bio / Description / Mandate */}
          {(record.bio || record.description || record.purpose) && (
            <div className="bg-[#f9fbfb] border border-[#e8f0f2] rounded-xl p-4 text-xs leading-relaxed text-[#374f54] space-y-1.5">
              <strong className="block text-[11px] font-bold text-foreground uppercase tracking-wider">
                {record.purpose ? 'Mandate & Purpose' : record.bio ? 'About / Biography' : 'Overview & Description'}
              </strong>
              <p className="whitespace-pre-line text-[#4a6369]">
                {record.bio || record.purpose || record.description}
              </p>
            </div>
          )}

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {record.program && (
              <div className="p-3 bg-surface border border-[#eaf0f2] rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b9ea3] block">
                  Program
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">{record.program}</span>
              </div>
            )}

            {record.qualification && (
              <div className="p-3 bg-surface border border-[#eaf0f2] rounded-xl sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b9ea3] block">
                  Academic Qualifications
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">{record.qualification}</span>
              </div>
            )}

            {record.faculty && (
              <div className="p-3 bg-surface border border-[#eaf0f2] rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b9ea3] block">
                  Faculty
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">{record.faculty}</span>
              </div>
            )}

            {record.student_id && (
              <div className="p-3 bg-surface border border-[#eaf0f2] rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b9ea3] block">
                  Student ID
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">{record.student_id}</span>
              </div>
            )}

            {record.academic_year && (
              <div className="p-3 bg-surface border border-[#eaf0f2] rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b9ea3] block">
                  Academic Year
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">{record.academic_year}</span>
              </div>
            )}

            {/* Club specific meetings */}
            {(record.meeting_day || record.meeting_time || record.meeting_location) && (
              <div className="p-3 bg-surface border border-[#eaf0f2] rounded-xl sm:col-span-2 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b9ea3] block">
                  Meeting Schedule
                </span>
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Calendar size={13} />
                  <span>
                    {record.meeting_day || 'Weekly'}
                    {record.meeting_time ? ` at ${formatTime(record.meeting_time)}` : ''}
                  </span>
                </div>
                {record.meeting_location && (
                  <p className="text-[11px] text-[#61777d] flex items-center gap-1.5 mt-0.5">
                    <MapPin size={12} /> {record.meeting_location}
                  </p>
                )}
              </div>
            )}

            {/* Committee Leadership */}
            {(record.chairperson || record.secretary) && (
              <div className="p-3 bg-surface border border-[#eaf0f2] rounded-xl sm:col-span-2 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b9ea3] block">
                  Committee Leadership
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {record.chairperson && (
                    <div>
                      <small className="text-[10px] text-[#8b9ea3]">Chairperson</small>
                      <strong className="block text-xs text-foreground">{record.chairperson}</strong>
                    </div>
                  )}
                  {record.secretary && (
                    <div>
                      <small className="text-[10px] text-[#8b9ea3]">Secretary</small>
                      <strong className="block text-xs text-foreground">{record.secretary}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── LECTURER CONSULTATION HOURS SECTION ───────────────── */}
          {categoryKey === 'lecturers' && (
            <div className="space-y-3 pt-2 border-t border-[#edf2f4]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Office & Consultation Hours
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#6a8288] bg-[#f1f6f7] px-2 py-0.5 rounded-full">
                  {consultations.length} {consultations.length === 1 ? 'Slot' : 'Slots'}
                </span>
              </div>

              {loadingConsultations ? (
                <div className="py-6 text-center text-xs text-[#7e9499] bg-surface-secondary rounded-xl border border-dashed border-[#d6e3e5]">
                  Loading consultation slots...
                </div>
              ) : consultations.length === 0 ? (
                <div className="p-4 bg-[#f8fbfb] rounded-xl border border-[#e3edf0] text-center text-xs text-[#6e858b]">
                  <p>No active consultation slots published yet for this lecturer.</p>
                  <p className="text-[11px] text-[#93a7ac] mt-1">
                    Please send an email inquiry or check departmental announcement boards.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {consultations.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl border border-[#e0ecee] bg-[#fdfefe] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-bold text-foreground">{slot.day_of_week}</strong>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              slot.mode === 'Virtual'
                                ? 'bg-[var(--primary-soft)] text-primary'
                                : 'bg-[#e7f5f7] text-primary'
                            }`}
                          >
                            {slot.mode || 'In-Person'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#4d666c] mt-0.5 flex items-center gap-1.5">
                          <Clock size={11} />
                          <span>
                            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                          </span>
                        </div>
                        {slot.location && (
                          <div className="text-[10px] text-[#71888e] mt-0.5 flex items-center gap-1">
                            <MapPin size={10} />
                            <span>{slot.location}</span>
                          </div>
                        )}
                      </div>

                      {slot.instructions && (
                        <div className="text-[10px] text-muted-foreground sm:max-w-xs italic sm:text-right">
                          {slot.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── COMMITTEE MEMBERS ROSTER SECTION ──────────────────── */}
          {categoryKey === 'committees' && (
            <div className="space-y-3 pt-2 border-t border-[#edf2f4]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Committee Roster
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#6a8288] bg-[#f1f6f7] px-2 py-0.5 rounded-full">
                  {committeeMembers.length} Members
                </span>
              </div>

              {loadingMembers ? (
                <div className="py-6 text-center text-xs text-[#7e9499] bg-surface-secondary rounded-xl border border-dashed border-[#d6e3e5]">
                  Loading committee members...
                </div>
              ) : committeeMembers.length === 0 ? (
                <div className="p-4 bg-[#f8fbfb] rounded-xl border border-[#e3edf0] text-center text-xs text-[#6e858b]">
                  No individual members registered in directory.
                </div>
              ) : (
                <div className="divide-y divide-[#edf3f4] rounded-xl border border-[#e0ecee] overflow-hidden bg-surface">
                  {committeeMembers.map((member) => (
                    <div key={member.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-surface-secondary">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-soft)] text-primary font-black text-xs grid place-items-center flex-shrink-0">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <strong className="block font-bold text-foreground">{member.name}</strong>
                          <span className="text-[11px] text-[#6b8287]">{member.role || 'Member'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="w-7 h-7 rounded-full bg-[#f1f6f7] text-primary hover:bg-primary hover:text-white grid place-items-center transition-colors text-xs"
                            title={`Email ${member.name}`}
                          >
                            <Mail size={12} />
                          </a>
                        )}
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            className="w-7 h-7 rounded-full bg-[#f1f6f7] text-primary hover:bg-primary hover:text-white grid place-items-center transition-colors text-xs"
                            title={`Call ${member.name}`}
                          >
                            <Phone size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#eef2f3] bg-surface-secondary flex items-center justify-between">
          <span className="text-[10px] text-[#869b9f]">Chemistry Department Directory</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
