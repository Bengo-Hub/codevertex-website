// DB-sourced course type (mirrors Prisma Course model)
export interface InstallmentPayment {
  amount: number;
  label: string;
}

export interface InstallmentPlan {
  label: string;
  payments: InstallmentPayment[];
  totalAmount: number;
  badge?: string;
}

export interface WeeklyModule {
  week: number | string;
  title: string;
  topics: string[];
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar?: string;
}

/**
 * Free-form course page content stored in Course.metadata (JSON) so new page sections
 * can be added without schema migrations. Every key is optional and editable from the
 * admin course editor. Keys starting with "_" are system-owned (e.g. _seedVersion) and
 * are never exposed to or overwritten by the admin editor.
 */
export interface CourseMetadata {
  /** Week-by-week curriculum shown on the course page. */
  curriculum?: WeeklyModule[];
  /** Course-specific testimonials (falls back to none). */
  testimonials?: Testimonial[];
  /** Show the shared alumni-companies strip on the course page. */
  showAlumni?: boolean;
  /** Brochure PDF path (under /public) or absolute URL. */
  brochure?: string;
  /** Physical venue shown in the hero facts. */
  location?: string;
  /** Typical cohort size shown in the hero facts. */
  cohortSize?: number;
  /** Age range for kids/teens programmes, e.g. "6-10". */
  ageRange?: string;
  /** Weekly schedule summary, e.g. "Saturdays 9am-12pm or daily during school holidays". */
  schedule?: string;
  /** What learners/parents need to bring or have. */
  requirements?: string[];
  /** Short highlight bullets shown under the hero. */
  highlights?: string[];
  /** System-owned: last seed revision applied to this row. */
  _seedVersion?: number;
}

export interface DbCourse {
  id: string;
  categoryId: string;
  name: string;
  shortName: string | null;
  slug: string;
  duration: string;
  mode: string;
  price: number;
  currency: string;
  description: string;
  longDescription: string | null;
  level: string;
  audience: string | null;
  stack: string | null;
  coverImage: string | null;
  outcomes: string[];
  prerequisites: string[];
  careerPaths: string[];
  includes: string[];
  featured: boolean;
  isActive: boolean;
  installmentsEnabled: boolean;
  installmentPlans: InstallmentPlan[];
  sortOrder: number;
  metadata: CourseMetadata;
  createdAt: string;
  updatedAt: string;
}
