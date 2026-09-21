/**
 * Sample data for the academic hub screen.
 * These shapes are the contract for the FastAPI response models.
 */
export const MOCK_TODAY = {
  greeting_name: 'Maya',
  date_label: 'Monday 12 October',
  summary_line: 'Three sessions today, one experiment awaiting your results.',
  week: 6,
  days: [
    { id: 'mon', label: 'MON', date: '12', active: true },
    { id: 'tue', label: 'TUE', date: '13', active: false },
    { id: 'wed', label: 'WED', date: '14', active: false },
    { id: 'thu', label: 'THU', date: '15', active: false },
    { id: 'fri', label: 'FRI', date: '16', active: false },
  ],
  sessions: [
    {
      id: 1,
      time_range: '09:00–10:30',
      kind: 'lecture',
      tag: 'Lecture',
      course_code: 'CHEM 214',
      title: 'Organic mechanisms',
      venue: 'Wöhler Theatre',
      current: false,
    },
    {
      id: 2,
      time_range: '11:00–13:00',
      kind: 'lab',
      tag: 'Lab · Prep done',
      course_code: 'CHEM 208',
      title: 'Kinetics: iodine clock',
      venue: 'Teaching Lab 2',
      current: true,
    },
    {
      id: 3,
      time_range: '15:00–16:00',
      kind: 'workshop',
      tag: 'Workshop',
      course_code: 'CHEM 226',
      title: 'Spectroscopy workshop',
      venue: 'Seminar 4.12',
      current: false,
    },
  ],
}

export const MOCK_MODULES = [
  {
    id: 1,
    course_code: 'CHEM 208',
    title: 'Physical chemistry',
    subtitle: 'Experiment 04 · Kinetics',
    status: 'Results due tomorrow',
    status_tone: 'urgent',
    percent: 72,
    accent: 'cyan',
  },
  {
    id: 2,
    course_code: 'CHEM 214',
    title: 'Organic chemistry II',
    subtitle: 'Problem set 06',
    status: 'Submitted',
    status_tone: 'done',
    percent: 88,
    accent: 'amber',
  },
  {
    id: 3,
    course_code: 'CHEM 226',
    title: 'Analytical methods',
    subtitle: 'Spectra workbook',
    status: 'In progress',
    status_tone: 'active',
    percent: 54,
    accent: 'blue',
  },
]

export const MOCK_DEADLINE = {
  id: 1,
  label: 'Next deadline',
  remaining: '21h remaining',
  title: 'Kinetics practical — results & discussion',
  due_day: 'TUE 13',
  due_time: '16:00',
}

export const MOCK_NOTE = {
  id: 1,
  eyebrow: 'Department note',
  title: 'New NMR suite opens this week',
  body: 'Booking access and instrument training are now available to second-year students.',
  link_label: 'Read announcement',
  href: '/announcements/nmr-suite',
}

export const MOCK_DEPT_EVENTS = [
  {
    id: 1,
    day: '14',
    month: 'OCT',
    title: 'Green chemistry seminar',
    meta: 'Dr. Lina Okafor · 17:30',
  },
  { id: 2, day: '16', month: 'OCT', title: 'Careers in formulation', meta: 'Atrium · 13:00' },
]

export const MOCK_DIRECTORY = { peer_count: 84 }
