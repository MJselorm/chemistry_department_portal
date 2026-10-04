/**
 * Centralized API endpoints for the Chemistry Department Portal.
 * 
 * Existing FastAPI backend routes:
 * - POST /auth/sync
 * - GET  /users/me
 * - PATCH /users/me
 * - GET  /admin/test
 * - GET  /health
 */

export const ENDPOINTS = {
  // Live Backend Routes (FastAPI + Supabase PostgreSQL)
  sync: '/auth/sync',              // POST: Sync/provision Firebase profile
  me: '/users/me',                 // GET/PATCH: authenticated profile
  myProfilePhoto: '/users/me/photo',
  notifications: '/notifications',
  markNotificationRead: (id) => `/notifications/${encodeURIComponent(id)}/read`,
  markAllNotificationsRead: '/notifications/read-all',
  adminTest: '/admin/test',        // GET: Check admin role requirement
  health: '/health',               // GET: Health check

  // Event Management API
  dashboardSummary: '/dashboard/summary',
  events: '/api/events',
  upcomingEvents: '/api/events/upcoming',
  eventDetails: (id) => `/api/events/${id}`,
  eventsHealth: '/api/events/health',
  adminCreateEvent: '/api/events',
  adminUpdateEvent: (id) => `/api/events/${id}`,
  adminDeleteEvent: (id) => `/api/events/${id}`,
  publishEvent: (id) => `/api/events/${id}/publish`,
  cancelEvent: (id) => `/api/events/${id}/cancel`,

  // Private academic-resource repository (Supabase Storage with migration support)
  academicCategories: '/academic/categories',
  academicResources: '/api/resources',
  academicFolders: '/api/resources/folders',
  academicSearch: '/api/resources/search',
  academicHealth: '/api/resources/health',
  academicDownload: (id) => `/api/resources/${id}/download`,
  academicView: (id) => `/api/resources/${id}/view`,
  adminSyncResources: '/api/resources/sync',
  adminIndexMigratedResources: '/api/resources/storage-index',
  adminUpdateResource: (id) => `/api/resources/${id}`,
  adminUploadResource: '/api/resources/upload',
  adminRemoveResource: (id) => `/api/resources/${id}`,

  // Announcements & Directory
  directory: '/directory/people',
  announcements: '/announcements',
  userSettings: '/users/settings',
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
