/**
 * Codevertex Website — Prisma Seed
 *
 * Data is split across:
 *   prisma/seed/courses.ts  — course catalog (with SVG cover images)
 *   prisma/seed/cohorts.ts  — scheduled cohorts
 *   prisma/seed/blog.ts     — starter blog posts
 *
 * Run:  pnpm prisma db seed
 * Env:  DATABASE_URL must be set
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { COURSES, DEPRECATED_COURSE_IDS } from './seed/courses';
import { COHORTS } from './seed/cohorts';
import { BLOG_POSTS } from './seed/blog';
import { seedDigitikaRbac, pushDigitikaRolesToAuthRegistry } from './seed/digitika-rbac';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding Codevertex website database...');

  // ── Digitika admin-panel RBAC (permissions + digitika_admin/digitika_staff roles) ──
  await seedDigitikaRbac(prisma);
  await pushDigitikaRolesToAuthRegistry();

  // ── Courses ──────────────────────────────────────────────────────────────
  // The DB is the source of truth (edited from /admin/courses). A seed entry is written
  // in full only when the row is missing, or when the entry's seedVersion is higher than
  // the row's metadata._seedVersion (a deliberate one-time content revision). Otherwise
  // only missing metadata keys are backfilled. Admin edits are never reset by a deploy.
  console.log('\n🗑️  Removing deprecated course IDs...');
  const deleted = await prisma.course.deleteMany({
    where: { id: { in: DEPRECATED_COURSE_IDS } },
  });
  console.log(`  ✓ Removed ${deleted.count} deprecated course(s)`);

  console.log(`\n📚 Seeding ${COURSES.length} courses...`);
  const existingCourses = await prisma.course.findMany({
    where: { id: { in: COURSES.map((c) => c.id) } },
    select: { id: true, metadata: true },
  });
  const existingById = new Map(existingCourses.map((c) => [c.id, c.metadata as Record<string, unknown> | null]));

  for (const course of COURSES) {
    const { seedVersion = 0, metadata = {}, ...fields } = course;
    const data = {
      ...fields,
      featured: fields.featured ?? false,
      installmentsEnabled: fields.installmentsEnabled ?? fields.installmentPlans.length > 0,
      installmentPlans: fields.installmentPlans as unknown as Prisma.InputJsonValue,
      metadata: { ...metadata, _seedVersion: seedVersion } as Prisma.InputJsonValue,
    };

    if (!existingById.has(course.id)) {
      await prisma.course.create({ data });
      console.log(`  ✓ Created: ${course.name}`);
      continue;
    }

    const current = existingById.get(course.id) ?? {};
    const appliedVersion = typeof current._seedVersion === 'number' ? current._seedVersion : 0;
    if (appliedVersion < seedVersion) {
      // Deliberate one-time content revision for this course.
      await prisma.course.update({ where: { id: course.id }, data });
      console.log(`  ↺ Applied seed v${seedVersion}: ${course.name}`);
      continue;
    }

    // Admin-managed row: only backfill page-content keys it does not have yet (e.g. the
    // curriculum that used to live in static config). Never overwrites existing values.
    const missing = Object.fromEntries(Object.entries(metadata).filter(([k]) => !(k in current)));
    if (Object.keys(missing).length > 0) {
      await prisma.course.update({
        where: { id: course.id },
        data: { metadata: { ...current, ...missing } as Prisma.InputJsonValue },
      });
      console.log(`  + Backfilled ${Object.keys(missing).join(', ')}: ${course.name}`);
    } else {
      console.log(`  = Kept (admin-managed): ${course.name}`);
    }
  }

  // ── Cohorts ───────────────────────────────────────────────────────────────
  // Create-only: once a cohort exists, admins own its dates, slots and status.
  console.log(`\n📅 Seeding ${COHORTS.length} cohorts...`);
  const existingCohorts = await prisma.cohort.findMany({
    where: { courseId: { in: [...new Set(COHORTS.map((c) => c.courseId))] } },
    select: { courseId: true, startDate: true },
  });
  const cohortKey = (courseId: string, startDate: Date) => `${courseId}|${startDate.toISOString().slice(0, 10)}`;
  const existingCohortKeys = new Set(existingCohorts.map((c) => cohortKey(c.courseId, c.startDate)));
  const newCohorts = COHORTS.filter((c) => !existingCohortKeys.has(cohortKey(c.courseId, c.startDate)));
  if (newCohorts.length > 0) {
    await prisma.cohort.createMany({ data: newCohorts });
  }
  console.log(`  ✓ Created ${newCohorts.length}, kept ${COHORTS.length - newCohorts.length} existing`);

  // ── Blog posts ────────────────────────────────────────────────────────────
  // Create-only: posts are edited from /admin/blog after the first seed.
  console.log(`\n📝 Seeding ${BLOG_POSTS.length} blog posts...`);
  const blog = await prisma.blogPost.createMany({ data: BLOG_POSTS, skipDuplicates: true });
  console.log(`  ✓ Created ${blog.count}, kept ${BLOG_POSTS.length - blog.count} existing`);

  console.log('\n✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
