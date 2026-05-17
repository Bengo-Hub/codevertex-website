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

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { COURSES, INSTALLMENT_PLANS_MAP, DEPRECATED_COURSE_IDS } from './seed/courses';
import { COHORTS } from './seed/cohorts';
import { BLOG_POSTS } from './seed/blog';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding Codevertex website database...');

  // ── Courses ──────────────────────────────────────────────────────────────
  console.log('\n🗑️  Removing deprecated course IDs...');
  const deleted = await prisma.course.deleteMany({
    where: { id: { in: DEPRECATED_COURSE_IDS } },
  });
  console.log(`  ✓ Removed ${deleted.count} deprecated course(s)`);

  console.log(`\n📚 Seeding ${COURSES.length} courses...`);
  for (const course of COURSES) {
    const plans = INSTALLMENT_PLANS_MAP[course.id] ?? [];
    const data = {
      ...course,
      featured: course.featured ?? false,
      installmentsEnabled: course.installmentsEnabled ?? plans.length > 0,
      installmentPlans: plans,
    };
    await prisma.course.upsert({
      where: { id: course.id },
      create: data,
      update: data,
    });
    console.log(`  ✓ ${course.name}`);
  }

  // ── Cohorts ───────────────────────────────────────────────────────────────
  console.log(`\n📅 Seeding ${COHORTS.length} cohorts...`);
  for (const cohort of COHORTS) {
    const existing = await prisma.cohort.findFirst({
      where: { name: cohort.name, courseId: cohort.courseId },
    });
    if (!existing) {
      await prisma.cohort.create({ data: cohort });
      console.log(`  ✓ Created: ${cohort.name}`);
    } else {
      await prisma.cohort.update({
        where: { id: existing.id },
        data: {
          startDate: cohort.startDate,
          endDate: cohort.endDate,
          maxSlots: cohort.maxSlots,
          status: cohort.status,
        },
      });
      console.log(`  ↺ Updated: ${cohort.name}`);
    }
  }

  // ── Blog posts ────────────────────────────────────────────────────────────
  console.log(`\n📝 Seeding ${BLOG_POSTS.length} blog posts...`);
  for (const post of BLOG_POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: post,
      update: post,
    });
    console.log(`  ✓ ${post.title}`);
  }

  console.log('\n✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
