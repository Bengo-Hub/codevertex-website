/**
 * Digitika Academy — Cohort seed data
 *
 * registrationFrom: 4 weeks before cohort start (when applications open)
 * registrationUntil: 1 week before cohort start (application deadline)
 * registrationExtDays: 0 by default; admin can increase from the dashboard to grant an extension
 */

export interface CohortSeed {
  courseId: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  registrationFrom: Date;
  registrationUntil: Date;
  registrationExtDays: number;
  maxSlots: number;
  status: string;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function d(s: string): Date { return new Date(s); }

/** Default registration window: opens 4 weeks before start, closes 1 week before start. */
function regWindow(startDate: Date): { registrationFrom: Date; registrationUntil: Date } {
  return {
    registrationFrom: addDays(startDate, -28),
    registrationUntil: addDays(startDate, -7),
  };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Cohort name = course label + a month/year slice derived from the start date.
 * Deriving the suffix (rather than hardcoding it) keeps the name in sync with the
 * actual start date and guarantees intakes of the same course never collide.
 * UTC getters are used so the date string parses identically regardless of TZ.
 */
function withMonthYear(base: string, startDate: Date): string {
  return `${base} — ${MONTHS[startDate.getUTCMonth()]} ${startDate.getUTCFullYear()}`;
}

// Each entry's `name` is the bare course label; the month/year slice is appended
// from the start date below (see withMonthYear). Scheduling (dates, intakes,
// status) is managed by admins via the backend; the start date is what learners
// see on the course detail page. Cohorts are keyed by (courseId, startDate) on
// seed, so a course can have multiple intakes.
const RAW_COHORTS: CohortSeed[] = [
  // ── Code-Starter ─────────────────────────────────────────────────────────
  {
    courseId: 'code-starter', name: 'Code-Starter',
    startDate: d('2026-05-19'), endDate: addWeeks(d('2026-05-19'), 10),
    ...regWindow(d('2026-05-19')),
    registrationExtDays: 0, maxSlots: 20, status: 'open',
  },
  {
    courseId: 'code-starter', name: 'Code-Starter',
    startDate: d('2026-08-04'), endDate: addWeeks(d('2026-08-04'), 10),
    ...regWindow(d('2026-08-04')),
    registrationExtDays: 0, maxSlots: 20, status: 'open',
  },

  // ── ICDL (Levels 1–5) ───────────────────────────────────────────────────
  {
    courseId: 'icdl-l1', name: 'ICDL Level 1',
    startDate: d('2026-06-02'), endDate: addWeeks(d('2026-06-02'), 4),
    ...regWindow(d('2026-06-02')),
    registrationExtDays: 0, maxSlots: 25, status: 'open',
  },
  {
    courseId: 'icdl-l1', name: 'ICDL Level 1',
    startDate: d('2026-07-07'), endDate: addWeeks(d('2026-07-07'), 4),
    ...regWindow(d('2026-07-07')),
    registrationExtDays: 0, maxSlots: 25, status: 'open',
  },
  {
    courseId: 'icdl-l2', name: 'ICDL Level 2',
    startDate: d('2026-06-02'), endDate: addWeeks(d('2026-06-02'), 4),
    ...regWindow(d('2026-06-02')),
    registrationExtDays: 0, maxSlots: 25, status: 'open',
  },
  {
    courseId: 'icdl-l3', name: 'ICDL Level 3',
    startDate: d('2026-07-07'), endDate: addWeeks(d('2026-07-07'), 5),
    ...regWindow(d('2026-07-07')),
    registrationExtDays: 0, maxSlots: 20, status: 'open',
  },
  {
    courseId: 'icdl-l4', name: 'ICDL Level 4',
    startDate: d('2026-08-04'), endDate: addWeeks(d('2026-08-04'), 8),
    ...regWindow(d('2026-08-04')),
    registrationExtDays: 0, maxSlots: 20, status: 'open',
  },
  {
    courseId: 'icdl-l5', name: 'ICDL Level 5',
    startDate: d('2026-09-08'), endDate: addWeeks(d('2026-09-08'), 8),
    ...regWindow(d('2026-09-08')),
    registrationExtDays: 0, maxSlots: 15, status: 'open',
  },

  // ── Software Engineering ──────────────────────────────────────────────────
  {
    courseId: 'fullstack', name: 'Full-Stack Web Development',
    startDate: d('2026-06-09'), endDate: addWeeks(d('2026-06-09'), 12),
    ...regWindow(d('2026-06-09')),
    registrationExtDays: 0, maxSlots: 15, status: 'open',
  },
  {
    courseId: 'kids-scratch', name: 'Coding for Kids',
    startDate: d('2026-08-03'), endDate: addWeeks(d('2026-08-03'), 8),
    ...regWindow(d('2026-08-03')),
    registrationExtDays: 0, maxSlots: 15, status: 'open',
  },
  {
    courseId: 'cybersec', name: 'Cybersecurity Fundamentals',
    startDate: d('2026-06-23'), endDate: addWeeks(d('2026-06-23'), 6),
    ...regWindow(d('2026-06-23')),
    registrationExtDays: 0, maxSlots: 20, status: 'open',
  },

  // ── CCNA ──────────────────────────────────────────────────────────────────
  {
    courseId: 'ccna-1', name: 'CCNA v7 Part 1',
    startDate: d('2026-05-26'), endDate: addWeeks(d('2026-05-26'), 8),
    ...regWindow(d('2026-05-26')),
    registrationExtDays: 0, maxSlots: 20, status: 'open',
  },
  {
    courseId: 'ccna-2', name: 'CCNA v7 Part 2',
    startDate: d('2026-07-20'), endDate: addWeeks(d('2026-07-20'), 8),
    ...regWindow(d('2026-07-20')),
    registrationExtDays: 0, maxSlots: 20, status: 'open',
  },

  // ── AI & Data ─────────────────────────────────────────────────────────────
  {
    courseId: 'ai-fundamentals', name: 'AI Fundamentals',
    startDate: d('2026-06-16'), endDate: addWeeks(d('2026-06-16'), 6),
    ...regWindow(d('2026-06-16')),
    registrationExtDays: 0, maxSlots: 30, status: 'open',
  },
  {
    courseId: 'data-python', name: 'Data Analytics with Python',
    startDate: d('2026-07-14'), endDate: addWeeks(d('2026-07-14'), 10),
    ...regWindow(d('2026-07-14')),
    registrationExtDays: 0, maxSlots: 20, status: 'open',
  },
];

// Final seed list — each cohort name gets its month/year slice derived from the
// start date so names stay unique and consistent with the schedule.
export const COHORTS: CohortSeed[] = RAW_COHORTS.map((c) => ({
  ...c,
  name: withMonthYear(c.name, c.startDate),
}));
