import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { resolvePaidAccess } from '@/lib/digitika-access';

async function nextCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.certificate.count({
    where: { certificateNumber: { startsWith: `CV-DGT-${year}-` } },
  });
  return `CV-DGT-${year}-${String(count + 1).padStart(6, '0')}`;
}

/**
 * Issues a certificate with a fresh sequential number, retrying on a rare
 * concurrent-issuance collision (two students completing a course in the
 * same instant could both compute the same count() before either insert
 * lands — the unique constraint on certificateNumber then rejects the
 * second one). A handful of retries is enough; this isn't a high-write-rate
 * table.
 */
async function createCertificateWithRetry(data: {
  studentUserId: string;
  courseId: string;
  studentName: string;
  courseName: string;
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const certificateNumber = await nextCertificateNumber();
    try {
      return await prisma.certificate.create({ data: { ...data, certificateNumber } });
    } catch (err) {
      const isUniqueClash = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
      if (!isUniqueClash || attempt === 4) throw err;
    }
  }
  throw new Error('Failed to allocate a certificate number after retries');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string; courseId: string }> }
) {
  const { studentId, courseId } = await params;
  const sid = studentId.trim().toUpperCase();

  const cert = await prisma.certificate.findFirst({
    where: { studentUserId: sid, courseId, revoked: false },
  });
  return NextResponse.json(cert ?? null);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string; courseId: string }> }
) {
  const { studentId, courseId } = await params;
  const { student, hasAccess } = await resolvePaidAccess(studentId, courseId);

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  if (!hasAccess) return NextResponse.json({ error: 'No paid enrollment for this course' }, { status: 403 });

  const existing = await prisma.certificate.findFirst({
    where: { studentUserId: student.id, courseId, revoked: false },
  });
  if (existing) return NextResponse.json(existing);

  const [course, totalLessons, completedLessons] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId } }),
    prisma.lesson.count({ where: { module: { courseId } } }),
    prisma.lessonProgress.count({
      where: { studentUserId: student.id, completedAt: { not: null }, lesson: { module: { courseId } } },
    }),
  ]);

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  if (totalLessons === 0 || completedLessons < totalLessons) {
    return NextResponse.json(
      { error: 'Course not yet complete', completedLessons, totalLessons },
      { status: 400 }
    );
  }

  const certificate = await createCertificateWithRetry({
    studentUserId: student.id,
    courseId,
    studentName: student.fullName,
    courseName: course.name,
  });

  return NextResponse.json(certificate, { status: 201 });
}
