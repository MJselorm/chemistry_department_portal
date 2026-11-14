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
  me: '/users/me',                 // GET: Read authenticated profile, PATCH: update full_name
  adminTest: '/admin/test',        // GET: Check admin role requirement
  adminUserRoleRequests: (id) => `/admin/users/${id}/role-change-requests`,
  adminRoleChangeRequests: '/admin/role-change-requests',
  approveAdminRoleChange: (id) => `/admin/role-change-requests/${id}/approve`,
  rejectAdminRoleChange: (id) => `/admin/role-change-requests/${id}/reject`,
  health: '/health',               // GET: Health check

  // Event Management API
  dashboardSummary: '/dashboard/summary',
  events: '/api/events',
  upcomingEvents: '/api/events/upcoming',
  eventDetails: (id) => `/api/events/${id}`,
  eventsHealth: '/api/events/health',
  adminCreateEvent: '/api/events',
  adminCreatePublishedEvent: '/api/events/published',
  adminUpdateEvent: (id) => `/api/events/${id}`,
  adminDeleteEvent: (id) => `/api/events/${id}`,
  publishEvent: (id) => `/api/events/${id}/publish`,
  cancelEvent: (id) => `/api/events/${id}/cancel`,

  // Academic Storage resource API
  academicCategories: '/academic/categories',
  academicResources: '/api/resources',
  academicFolders: '/api/resources/folders',
  academicSearch: '/api/resources/search',
  academicHealth: '/api/resources/health',
  academicDownload: (id) => `/api/resources/${id}/download`,
  academicDownloadLink: (id) => `/api/resources/${id}/download-link`,
  academicPreviewLink: (id) => `/api/resources/${id}/preview-link`,
  academicView: (id) => `/api/resources/${id}/view`,
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
  notifications: '/api/notifications',
  notificationUnreadCount: '/api/notifications/unread-count',
  notificationRead: (id) => `/api/notifications/${id}/read`,
  notificationDismiss: (id) => `/api/notifications/${id}/dismiss`,
  notificationReadAll: '/api/notifications/read-all',
  pushPublicKey: '/api/notifications/push/public-key',
  pushSubscriptions: '/api/notifications/push/subscriptions',
  pushUnsubscribe: '/api/notifications/push/subscriptions/unsubscribe',
  adminNotifications: '/api/notifications/admin',
  adminNotificationCancel: (id) => `/api/notifications/admin/${id}/cancel`,
  adminNotificationArchive: (id) => `/api/notifications/admin/${id}/archive`,
  adminNotificationResend: (id) => `/api/notifications/admin/${id}/resend`,
  adminManageUsers: '/admin/users',

  // Authenticated privacy and personal-data requests
  privacyRequests: '/api/privacy/requests/me',
  privacyExport: '/api/privacy/requests/export',
  privacyDeletion: '/api/privacy/requests/deletion',
  adminPrivacyRequests: '/api/privacy/admin/requests',
  adminPrivacyRequest: (id) => `/api/privacy/admin/requests/${id}`,

  // Mentor–Mentee Programme
  mentorshipMe: '/api/mentorship/me',
  mentorshipMentorApplications: '/api/mentorship/mentor-applications',
  mentorshipMenteeApplications: '/api/mentorship/mentee-applications',
  mentorshipNotificationPreferences: '/api/mentorship/notification-preferences',
  mentorshipMatchDecision: (id) => `/api/mentorship/matches/${id}/decision`,
  mentorshipGoals: (id) => `/api/mentorship/matches/${id}/goals`,
  mentorshipGoalComplete: (matchId, goalId) => `/api/mentorship/matches/${matchId}/goals/${goalId}/complete`,
  mentorshipProgressNotes: (id) => `/api/mentorship/matches/${id}/progress-notes`,
  mentorshipSessions: (id) => `/api/mentorship/matches/${id}/sessions`,
  mentorshipSessionConfirm: (matchId, sessionId) => `/api/mentorship/matches/${matchId}/sessions/${sessionId}/confirm`,
  mentorshipCompletion: (id) => `/api/mentorship/matches/${id}/completion`,
  mentorshipWithdraw: (id) => `/api/mentorship/matches/${id}/withdraw`,
  mentorshipReassignment: (id) => `/api/mentorship/matches/${id}/reassignment-requests`,
  mentorshipAdminAnalytics: '/api/mentorship/admin/analytics',
  mentorshipAdminMentorApplications: '/api/mentorship/admin/mentor-applications',
  mentorshipAdminMentorDecision: (id) => `/api/mentorship/admin/mentor-applications/${id}/decision`,
  mentorshipAdminWaitingList: '/api/mentorship/admin/waiting-list',
  mentorshipAdminMatches: '/api/mentorship/admin/matches',
  mentorshipAdminReassignments: '/api/mentorship/admin/reassignment-requests',
  mentorshipAdminReassignmentDecision: (id, decision) => `/api/mentorship/admin/reassignment-requests/${id}/decision?decision=${decision}`,
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
