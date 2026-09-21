/**
 * Every backend route the app touches, in one place.
 * Rename these to match your FastAPI routers and nothing else has to change.
 */
export const ENDPOINTS = {
  login: '/auth/token',            // POST form: username, password -> {access_token, token_type}
  me: '/auth/me',                  // GET  -> current user
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',

  dashboard: '/dashboard/summary', // GET  -> the four stat cards
  events: '/events/upcoming',      // GET  -> list
  rsvp: (id) => `/events/${id}/rsvp`,
  announcements: '/announcements', // GET  -> list
  nextLabSlot: '/lab/slots/next',  // GET
  reserveLabSlot: '/lab/slots/reserve', // POST
}

/** Academic hub screen. */
export const HUB_ENDPOINTS = {
  today: '/hub/today',                 // GET -> {greeting_name, summary_line, week, days[], sessions[]}
  modules: '/hub/modules',             // GET -> current module progress
  nextDeadline: '/hub/deadline',       // GET -> single upcoming deadline
  departmentNote: '/hub/note',         // GET -> pinned announcement
  departmentEvents: '/hub/events',     // GET -> list
  directory: '/hub/directory',         // GET -> {peer_count}
}
