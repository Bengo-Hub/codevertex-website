// Digitika Academy: category display metadata and shared course helpers.
//
// Course content (name, price, outcomes, curriculum, testimonials, brochure, ...) lives
// ONLY in the database (Course row + Course.metadata) and is edited from the admin panel.
// prisma/seed/courses.ts seeds the initial catalog; it never overwrites admin edits
// (see the seed-version notes there). Do not add per-course data to this file.
import { addDays, addWeeks } from 'date-fns';
import type { InstallmentPlan, Testimonial } from '../types/course';

export type { InstallmentPlan, WeeklyModule, Testimonial, CourseMetadata } from '../types/course';

// Cover images mapped by course ID — real photos under public/images/courses/
// Sourced from Unsplash (Unsplash License: free for commercial use, no
// attribution required, no watermark).
export const COURSE_COVER_IMAGES: Record<string, string> = {
  // Software Engineering
  'code-starter':   '/images/courses/code-starter.jpg',
  'fullstack':      '/images/courses/fullstack.jpg',
  'mobile-dev':     '/images/courses/mobile-dev.jpg',
  'devops':         '/images/courses/devops.jpg',
  'cybersec':       '/images/courses/cybersec.jpg',
  'kids-scratch':   '/images/courses/kids-scratch.jpg',
  'teens-web':      '/images/courses/teens-web.jpg',
  'kids-games':     '/images/courses/kids-games.jpg',
  'kids-robotics-ai': '/images/courses/kids-robotics-ai.jpg',
  // ICDL (Levels 1–5)
  'icdl-l1':       '/images/courses/icdl-l1.jpg',
  'icdl-l2':       '/images/courses/icdl-l2.jpg',
  'icdl-l3':       '/images/courses/icdl-l3.jpg',
  'icdl-l4':       '/images/courses/icdl-l4.jpg',
  'icdl-l5':       '/images/courses/icdl-l5.jpg',
  // CCNA
  'ccna-1':        '/images/courses/ccna-1.jpg',
  'ccna-2':        '/images/courses/ccna-2.jpg',
  'ccna-3':        '/images/courses/ccna-3.jpg',
  'ccna-cert':     '/images/courses/ccna-cert.jpg',
  // AI
  'ai-fundamentals': '/images/courses/ai-fundamentals.jpg',
  'ml-python':       '/images/courses/ml-python.jpg',
  'genai-llm':       '/images/courses/genai-llm.jpg',
  'ai-business':     '/images/courses/ai-business.jpg',
  // Data Analytics
  'data-python':          '/images/courses/data-python.jpg',
  'power-bi':             '/images/courses/power-bi.jpg',
  'sql-db':               '/images/courses/sql-db.jpg',
  'advanced-analytics':   '/images/courses/advanced-analytics.jpg',
};

export interface CourseCategory {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
}

// Display order of this list is the order categories render in the catalog.
export const COURSE_CATEGORIES: CourseCategory[] = [
  {
    id: 'kids',
    name: 'Digitika Kids & Teens',
    tagline: 'Ages 6-16 | CBC-aligned',
    description: 'Hands-on, project-based tech programmes for young learners: digital creativity, coding, game design, robotics and safe, age-appropriate AI. Built around the KICD coding and digital literacy strands.',
    color: '#EC4899',
  },
  {
    id: 'software',
    name: 'Software Engineering',
    tagline: 'Adults & Teens Programs',
    description: 'Industry-aligned coding programmes for working professionals, beginners, and teens aged 13-17.',
    color: '#10B981',
  },
  {
    id: 'icdl',
    name: 'ICDL Certification',
    tagline: 'International Computer Driving Licence',
    description: 'Globally recognised ICT competency certification, structured into the Levels 1-5 progression used by Kenyan colleges and universities, from foundational digital literacy to specialist emerging technologies.',
    color: '#9100B0',
  },
  {
    id: 'ccna',
    name: 'Cisco CCNA v7',
    tagline: 'Networking & Industry Certification',
    description: 'Industry-standard Cisco networking curriculum. Prepares students for the CCNA 200-301 exam.',
    color: '#0EA5E9',
  },
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    tagline: 'From Fundamentals to LLM Engineering',
    description: 'The most in-demand AI skills since 2025. Learn to build, deploy and monetise AI solutions.',
    color: '#8B5CF6',
  },
  {
    id: 'data',
    name: 'Data Analytics',
    tagline: 'Turn Data into Strategic Intelligence',
    description: 'From SQL to advanced BI dashboards: build the data skills companies pay top salaries for.',
    color: '#F59E0B',
  },
];

const FALLBACK_CATEGORY_COLOR = '#9100B0';

/**
 * Category display metadata for a course's categoryId. Never returns null: a course
 * created in admin under a new categoryId still renders (with a neutral colour)
 * instead of 404ing, which is what the old static-config lookup did.
 */
export function getCategory(categoryId: string): CourseCategory {
  return (
    COURSE_CATEGORIES.find((c) => c.id === categoryId) ?? {
      id: categoryId,
      name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      tagline: '',
      description: '',
      color: FALLBACK_CATEGORY_COLOR,
    }
  );
}

// --- Shared alumni data ---
export const ALUMNI_COMPANIES = [
  { name: 'Safaricom PLC', logo: '/images/safaricom-plc.png' },
  { name: 'Boxcraft', logo: '/images/boxcraft.png' },
  { name: 'Danka Africa', logo: '/images/danka-africa.jpeg' },
  { name: 'Maseno University', logo: '/images/maseno-university.png' },
  { name: 'Great Lakes University of Kisumu', logo: '/images/gluk.png' },
];

export const GRADUATE_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Ryan Mwakala',
    role: 'ICT Manager',
    company: 'Danka Africa',
    quote: "The Code-Starter programme gave me the practical skills I needed to transition into tech. Within 6 months of graduating I landed my first ICT management role.",
  },
  {
    name: 'Brandon Odhiambo',
    role: 'Software Developer',
    company: 'Boxcraft',
    quote: "I came in knowing nothing about coding. The curriculum is intense but the instructors make it digestible. I'm now writing production code every day.",
  },
  {
    name: 'Christine Kerubo',
    role: 'CS Tutor & Graduate',
    company: 'Maseno University',
    quote: "As a CS student I thought I knew enough. This programme showed me what real-world software engineering looks like. The Git and Linux modules alone were worth it.",
  },
  {
    name: 'Tricia Adhiambo',
    role: 'Emerging Tech Talent',
    company: 'Maseno University',
    quote: "The hybrid format was perfect for me — I could attend Zoom sessions when I couldn't make it in person. The community of learners keeps you accountable.",
  },
];

// --- Helper: payment-plan key, e.g. "2 Installments" -> "2-installments". Shared by the
// public checkout modal (which sends it) and the admin enrollment route (which resolves it). ---
export function planKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-');
}

/** Finds a course's installment plan by its planKey(); plans come from Course.installmentPlans. */
export function findInstallmentPlan(plans: unknown, key: string): InstallmentPlan | undefined {
  return Array.isArray(plans) ? (plans as InstallmentPlan[]).find((p) => planKey(p.label) === key) : undefined;
}

// --- Helper: derive due dates for a plan's payments — shared by the public
// checkout modal and the admin manual-enrollment route, so both generate
// identical schedules from the same InstallmentPlan data. ---
export function computeDueDates(plan: InstallmentPlan): Date[] {
  const today = new Date();
  return plan.payments.map((_, i) => {
    if (i === 0) return today;
    const label = plan.payments[i].label;
    const weekMatch = label.match(/week\s+(\d+)/i);
    if (weekMatch) {
      return addWeeks(today, parseInt(weekMatch[1], 10) - 1);
    }
    return addDays(today, 28 * i);
  });
}

export { TREASURY_PAY_URL } from '../lib/constants';
