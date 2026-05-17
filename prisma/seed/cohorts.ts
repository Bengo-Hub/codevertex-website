/**
 * Digitika Academy — Cohort seed data
 */

export interface CohortSeed {
  courseId: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  maxSlots: number;
  status: string;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function d(s: string): Date { return new Date(s); }

export const COHORTS: CohortSeed[] = [
  // Code-Starter
  { courseId: 'code-starter', name: 'Code-Starter — May 2026',    startDate: d('2026-05-19'), endDate: addWeeks(d('2026-05-19'), 10), maxSlots: 20, status: 'open' },
  { courseId: 'code-starter', name: 'Code-Starter — August 2026', startDate: d('2026-08-04'), endDate: addWeeks(d('2026-08-04'), 10), maxSlots: 20, status: 'open' },

  // ICDL
  { courseId: 'icdl-l1',  name: 'ICDL L1 — June 2026',   startDate: d('2026-06-02'), endDate: addWeeks(d('2026-06-02'), 4), maxSlots: 25, status: 'open' },
  { courseId: 'icdl-l1',  name: 'ICDL L1 — July 2026',   startDate: d('2026-07-07'), endDate: addWeeks(d('2026-07-07'), 4), maxSlots: 25, status: 'open' },
  { courseId: 'icdl-l2',  name: 'ICDL L2 — June 2026',   startDate: d('2026-06-02'), endDate: addWeeks(d('2026-06-02'), 4), maxSlots: 25, status: 'open' },
  { courseId: 'icdl-l3',  name: 'ICDL L3 — July 2026',   startDate: d('2026-07-07'), endDate: addWeeks(d('2026-07-07'), 5), maxSlots: 20, status: 'open' },
  { courseId: 'icdl-l45', name: 'ICDL L4&5 — August 2026', startDate: d('2026-08-04'), endDate: addWeeks(d('2026-08-04'), 8), maxSlots: 20, status: 'open' },

  // Software Engineering
  { courseId: 'fullstack',   name: 'Full-Stack — June 2026',      startDate: d('2026-06-09'), endDate: addWeeks(d('2026-06-09'), 12), maxSlots: 15, status: 'open' },
  { courseId: 'kids-scratch', name: 'Kids Coding — August 2026',  startDate: d('2026-08-03'), endDate: addWeeks(d('2026-08-03'), 8),  maxSlots: 15, status: 'open' },
  { courseId: 'cybersec',    name: 'Cybersecurity — June 2026',   startDate: d('2026-06-23'), endDate: addWeeks(d('2026-06-23'), 6),  maxSlots: 20, status: 'open' },

  // CCNA
  { courseId: 'ccna-1', name: 'CCNA Part 1 — May 2026',  startDate: d('2026-05-26'), endDate: addWeeks(d('2026-05-26'), 8), maxSlots: 20, status: 'open' },
  { courseId: 'ccna-2', name: 'CCNA Part 2 — July 2026', startDate: d('2026-07-20'), endDate: addWeeks(d('2026-07-20'), 8), maxSlots: 20, status: 'open' },

  // AI & Data
  { courseId: 'ai-fundamentals', name: 'AI Fundamentals — June 2026', startDate: d('2026-06-16'), endDate: addWeeks(d('2026-06-16'), 6),  maxSlots: 30, status: 'open' },
  { courseId: 'data-python',     name: 'Data Analytics — July 2026',  startDate: d('2026-07-14'), endDate: addWeeks(d('2026-07-14'), 10), maxSlots: 20, status: 'open' },
];
