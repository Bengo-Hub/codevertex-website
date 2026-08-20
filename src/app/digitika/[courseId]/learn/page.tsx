import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { LearnClient } from '@/components/digitika/LearnClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Content | Digitika — Codevertex',
  robots: { index: false, follow: false },
};

export default async function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await prisma.course.findFirst({ where: { id: courseId, isActive: true } });
  if (!course) notFound();

  return <LearnClient courseId={courseId} courseName={course.name} />;
}
