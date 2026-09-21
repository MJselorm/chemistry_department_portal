/**
 * Centralized API endpoints for the Chemistry Department Portal.
 * 
 * Existing FastAPI backend routes:
 * - POST /auth/sync
 * - GET  /users/me
 * - PATCH /users/me
 * - GET  /admin/test
 * - GET  /health
 * 
 * Future routes to be implemented in backend/ are marked with [PLACEHOLDER].
 */

export const ENDPOINTS = {
  // Live Backend Routes (FastAPI + Supabase PostgreSQL)
  sync: '/auth/sync',              // POST: Sync/provision Firebase profile
  me: '/users/me',                 // GET: Read authenticated profile, PATCH: update full_name
  adminTest: '/admin/test',        // GET: Check admin role requirement
  health: '/health',               // GET: Health check

  // [PLACEHOLDER] Routes to be implemented next in backend
  dashboardSummary: '/dashboard/summary',
  events: '/events/upcoming',
  eventDetails: (id) => `/events/${id}`,
  eventRegister: (id) => `/events/${id}/register`,
  eventCheckIn: '/events/checkin',
  academicCategories: '/academic/categories',
  academicResources: '/academic/resources',
  academicDownload: (id) => `/academic/resources/${id}/download`,
  directory: '/directory/people',
  announcements: '/announcements',
  userSettings: '/users/settings',
  adminCreateEvent: '/admin/events',
  adminUploadResource: '/admin/resources',
  adminPostAnnouncement: '/admin/announcements',
  adminManageUsers: '/admin/users',
}

export const HUB_ENDPOINTS = {
  today: '/hub/today',
  modules: '/hub/modules',
  nextDeadline: '/hub/deadline',
  departmentNote: '/hub/note',
  departmentEvents: '/hub/events',
  directory: '/hub/directory',
}
