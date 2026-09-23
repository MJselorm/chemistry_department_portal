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
  adminDeleteAnnouncement: (id) => `/admin/announcements/${id}`,
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

export const DIRECTORY_ENDPOINTS = {
  summary: '/api/directory/summary',
  search: '/api/directory/search',
  uploadImage: '/api/directory/uploads/images',
  departments: '/api/directory/departments',
  department: (id) => `/api/directory/departments/${id}`,
  executives: '/api/directory/executives',
  executive: (id) => `/api/directory/executives/${id}`,
  classRepresentatives: '/api/directory/class-representatives',
  classRepresentative: (id) => `/api/directory/class-representatives/${id}`,
  lecturers: '/api/directory/lecturers',
  lecturer: (id) => `/api/directory/lecturers/${id}`,
  lecturerConsultations: (lecturerId) => `/api/directory/lecturers/${lecturerId}/consultations`,
  consultation: (id) => `/api/directory/consultations/${id}`,
  courses: '/api/directory/courses',
  course: (id) => `/api/directory/courses/${id}`,
  clubs: '/api/directory/clubs',
  club: (id) => `/api/directory/clubs/${id}`,
  committees: '/api/directory/committees',
  committee: (id) => `/api/directory/committees/${id}`,
  committeeMembers: (committeeId) => `/api/directory/committees/${committeeId}/members`,
  committeeMember: (id) => `/api/directory/committee-members/${id}`,
  contacts: '/api/directory/contacts',
  contact: (id) => `/api/directory/contacts/${id}`,
}
