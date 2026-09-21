/**
 * Mock data extracted from the experimentals/chemistry_department_portal_frontend HTML prototypes.
 * Used for parts of the app where FastAPI endpoints have not yet been developed.
 */

export const MOCK_DASHBOARD_STATS = [
  { id: 'events', label: 'Upcoming events', value: '08', icon: '◷', color: 'blue' },
  { id: 'resources', label: 'Academic resources', value: '126', icon: '▣', color: 'green' },
  { id: 'students', label: 'Students connected', value: '342', icon: '◎', color: 'amber' },
  { id: 'announcements', label: 'New announcements', value: '14', icon: '▤', color: 'purple' },
]

export const MOCK_EVENTS = [
  {
    id: 'evt-1',
    month: 'OCT',
    day: '12',
    year: '2026',
    badge: 'SEMINAR',
    badgeColor: 'purple',
    title: 'Advances in Nanotechnology',
    category: 'Seminars',
    description: 'Explore emerging applications of nanomaterials with guest researchers and department faculty.',
    time: '10:00 AM',
    venue: 'Main Auditorium',
    organizer: 'Chemistry Department / GSCS',
    capacity: '250 seats',
    details: 'A departmental seminar on emerging nanomaterials, laboratory applications and current research directions. Network with researchers and discover postgraduate opportunities.'
  },
  {
    id: 'evt-2',
    month: 'NOV',
    day: '05',
    year: '2026',
    badge: 'WORKSHOP',
    badgeColor: 'green',
    title: 'HPLC Troubleshooting',
    category: 'Workshops',
    description: 'A practical session covering common HPLC problems, diagnostics and laboratory best practices.',
    time: '2:00 PM',
    venue: 'Lab 304',
    organizer: 'Analytical Chemistry Division',
    capacity: '40 seats',
    details: 'A hands-on laboratory workshop covering column maintenance, baseline drift resolution, and pressure troubleshooting in chromatography.'
  },
  {
    id: 'evt-3',
    month: 'NOV',
    day: '19',
    year: '2026',
    badge: 'CONFERENCE',
    badgeColor: 'amber',
    title: 'Chemistry Research Forum',
    category: 'Conferences',
    description: 'Student research presentations, poster sessions and a discussion with invited academics.',
    time: '9:00 AM',
    venue: 'Science Block',
    organizer: 'Department Research Committee',
    capacity: '180 seats',
    details: 'The premier annual gathering of undergraduate and postgraduate students showcasing recent findings in synthesis, bio-chemistry, and industrial materials.'
  }
]

export const MOCK_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    category: 'ACADEMIC',
    badgeColor: 'red',
    dotColor: '#db6666',
    title: 'Lab Schedule Changes — Level 200',
    snippet: 'Organic Chemistry Group B has moved to Thursday.',
    body: 'Organic Chemistry Group B laboratory session has been rescheduled to Thursday at 2:00 PM due to scheduled chemical hood ventilation maintenance.',
    timeAgo: '2 hours ago',
    shortTime: '2h'
  },
  {
    id: 'ann-2',
    category: 'RESOURCES',
    badgeColor: 'blue',
    dotColor: '#4c92bc',
    title: 'New Textbooks Available in Library',
    snippet: 'Physical chemistry references have been added.',
    body: 'The departmental physical library has received 15 copies of the latest edition of Atkins’ Physical Chemistry and Vogel’s Quantitative Chemical Analysis.',
    timeAgo: 'Yesterday',
    shortTime: '1d'
  },
  {
    id: 'ann-3',
    category: 'EVENTS',
    badgeColor: 'green',
    dotColor: '#4ca776',
    title: 'Seminar registration is open',
    snippet: 'Reserve your seat before capacity is reached.',
    body: 'Registration for the Advances in Nanotechnology seminar is now active. Please register early through the events portal as seats are limited.',
    timeAgo: '2 days ago',
    shortTime: '2d'
  }
]

export const MOCK_ACADEMIC_CATEGORIES = [
  { id: 'pq', title: 'Past Questions', description: 'Previous exam papers categorized by course and year.', files: '38 files', icon: '▤', color: 'blue' },
  { id: 'notes', title: 'Lecture Notes', description: 'Slides and handouts provided by lecturers.', files: '46 files', icon: '▣', color: 'green' },
  { id: 'textbooks', title: 'Textbooks', description: 'Recommended reading materials and reference books.', files: '21 files', icon: '▥', color: 'amber' },
  { id: 'manuals', title: 'Lab Manuals', description: 'Procedures, safety guides and report templates.', files: '15 files', icon: '⚗', color: 'purple' },
  { id: 'outlines', title: 'Course Outlines', description: 'Course descriptions, schedules and assessment details.', files: '06 files', icon: '☑', color: 'red' },
  { id: 'research', title: 'Research Resources', description: 'Useful databases, journals and research guides.', files: 'Coming soon', icon: '↗', color: 'slate' },
]

export const MOCK_RECENT_RESOURCES = [
  { id: 'res-1', name: 'CHEM301_Thermochemistry_Notes.pdf', meta: 'PDF · 4.2 MB', category: 'Lecture Notes', added: '2 days ago' },
  { id: 'res-2', name: 'Analytical_Chem_Lab_Manual_2026.docx', meta: 'DOCX · 2.8 MB', category: 'Lab Manuals', added: '1 week ago' },
  { id: 'res-3', name: 'CHEM204_Exam_2025.pdf', meta: 'PDF · 1.6 MB', category: 'Past Questions', added: '1 week ago' },
  { id: 'res-4', name: 'CHEM402_Coordination_Chemistry_Handout.pdf', meta: 'PDF · 3.1 MB', category: 'Lecture Notes', added: '2 weeks ago' },
]

export const MOCK_DIRECTORY_PEOPLE = [
  { id: 'p1', name: 'Jane Doe', role: 'GSCS President', level: 'Level 400 · Chemistry', category: 'GSCS Executives', initials: 'JD', email: 'j.doe@st.ug.edu.gh' },
  { id: 'p2', name: 'John Smith', role: 'General Secretary', level: 'Level 300 · Chemistry', category: 'GSCS Executives', initials: 'JS', email: 'j.smith@st.ug.edu.gh' },
  { id: 'p3', name: 'Ama Richards', role: 'Academic Coordinator', level: 'Level 400 · Chemistry', category: 'GSCS Executives', initials: 'AR', email: 'a.richards@st.ug.edu.gh' },
  { id: 'p4', name: 'Kwame Mensah', role: 'Class Rep (Level 200)', level: 'Level 200 · Chemistry', category: 'Class Representatives', initials: 'KM', email: 'k.mensah@st.ug.edu.gh' },
  { id: 'p5', name: 'Akua Osei', role: 'Class Rep (Level 300)', level: 'Level 300 · Chemistry', category: 'Class Representatives', initials: 'AO', email: 'a.osei@st.ug.edu.gh' },
  { id: 'p6', name: 'Dr. Robert Brown', role: 'Senior Lecturer, Physical Chemistry', level: 'Office: Room 204, Chemistry Wing', category: 'Lecturers', initials: 'RB', email: 'rbrown@ug.edu.gh' },
  { id: 'p7', name: 'Prof. Margaret Hansen', role: 'Head of Department, Organic Chemistry', level: 'Office: HoD Office, 1st Floor', category: 'Lecturers', initials: 'MH', email: 'mhansen@ug.edu.gh' },
]

export const MOCK_ADMIN_USERS = [
  { id: 'u-1', name: 'Dela Gogah', studentId: 'CHM/2026/001', level: '300', status: 'Active', role: 'student', badgeColor: 'blue' },
  { id: 'u-2', name: 'Jane Doe', studentId: 'CHM/2023/014', level: '400', status: 'Active', role: 'executive', badgeColor: 'purple' },
  { id: 'u-3', name: 'John Smith', studentId: 'CHM/2024/032', level: '300', status: 'Pending verification', role: 'student', badgeColor: 'green' },
  { id: 'u-4', name: 'Dr. Robert Brown', studentId: 'FAC/CHM/009', level: 'Faculty', status: 'Active', role: 'admin', badgeColor: 'purple' },
]

export const MOCK_ADMIN_ACTIVITY = [
  { id: 'act-1', text: 'New resource uploaded', desc: 'Analytical Chemistry Lab Manual', time: '1h', dotColor: '#4ca776' },
  { id: 'act-2', text: 'Event registration opened', desc: 'Advances in Nanotechnology', time: '3h', dotColor: '#4c92bc' },
  { id: 'act-3', text: 'Announcement published', desc: 'Lab schedule update', time: '1d', dotColor: '#d79a37' },
]
