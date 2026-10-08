import { z } from 'zod';
import type { CourseMetadata } from '@/types/course';

// Shared validation for admin course create/update (POST /api/admin/courses and
// PATCH /api/admin/courses/[id]). One schema so both routes accept the same fields.

const text = (max: number) => z.string().trim().max(max);
const list = (maxItems: number, maxLen = 300) => z.array(text(maxLen).min(1)).max(maxItems);

export const installmentPlanSchema = z.object({
  label: text(60).min(1),
  payments: z.array(z.object({ amount: z.number().int().min(0), label: text(60).min(1) })).min(1).max(12),
  totalAmount: z.number().int().min(0),
  badge: text(30).optional(),
});

// Admin-editable metadata keys only. System keys (prefixed "_") are rejected here and
// preserved server-side by mergeCourseMetadata().
export const courseMetadataSchema = z
  .object({
    curriculum: z
      .array(z.object({ week: z.union([z.number().int(), text(30)]), title: text(150).min(1), topics: list(20, 200) }))
      .max(52),
    testimonials: z
      .array(z.object({ name: text(80).min(1), role: text(80), company: text(80), quote: text(800).min(1), avatar: text(500).optional() }))
      .max(20),
    showAlumni: z.boolean(),
    brochure: text(500),
    location: text(200),
    cohortSize: z.number().int().min(1).max(500),
    ageRange: text(20),
    schedule: text(300),
    requirements: list(20, 200),
    highlights: list(8, 80),
  })
  .partial()
  .strict();

const slugSchema = z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens');
// Cover images are site-relative paths or https URLs; nothing else is rendered.
const imageSchema = z.string().trim().max(500).regex(/^(\/[^\s]*|https:\/\/[^\s]+)$/, 'Use a /path or https:// URL');

export const courseFieldsSchema = z.object({
  categoryId: slugSchema,
  name: text(200).min(2),
  shortName: text(80).nullish(),
  slug: slugSchema,
  duration: text(60).min(1),
  mode: text(80).min(1),
  price: z.number().int().min(0),
  currency: text(3).min(3).default('KES'),
  description: text(600).min(1),
  longDescription: text(8000).nullish(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  audience: text(120).nullish(),
  stack: text(500).nullish(),
  coverImage: imageSchema.nullish(),
  outcomes: list(30),
  prerequisites: list(20),
  careerPaths: list(20),
  includes: list(30),
  featured: z.boolean(),
  isActive: z.boolean(),
  installmentsEnabled: z.boolean(),
  installmentPlans: z.array(installmentPlanSchema).max(6),
  sortOrder: z.number().int(),
  metadata: courseMetadataSchema,
});

export const courseCreateSchema = courseFieldsSchema
  .partial()
  .required({ categoryId: true, name: true, slug: true, duration: true, mode: true, price: true, description: true })
  .extend({ id: slugSchema });

export const coursePatchSchema = courseFieldsSchema.partial();

/**
 * Merges an admin metadata edit onto the stored metadata: edited keys are replaced,
 * keys set to undefined are left alone, and system keys ("_" prefix, e.g. _seedVersion)
 * always survive so the seed never re-applies over admin edits.
 */
export function mergeCourseMetadata(stored: unknown, patch: CourseMetadata): CourseMetadata {
  const base = stored && typeof stored === 'object' && !Array.isArray(stored) ? (stored as CourseMetadata) : {};
  return { ...base, ...patch };
}

/** Maps Prisma/Zod errors from course writes to API responses. Returns null for unknown errors. */
export function courseWriteError(err: unknown): { status: number; body: unknown } | null {
  if (err instanceof z.ZodError) return { status: 400, body: { error: 'Invalid course data', issues: err.issues } };
  const code = err instanceof Error && 'code' in err ? (err as { code: string }).code : null;
  if (code === 'P2002') return { status: 409, body: { error: 'A course with this id or slug already exists' } };
  if (code === 'P2025') return { status: 404, body: { error: 'Not found' } };
  return null;
}
