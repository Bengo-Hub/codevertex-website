import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getParentSession } from '@/lib/parent-access';
import { getCourseProgress } from '@/lib/student-progress';
import { summarizeEnrollmentPayments } from '@/lib/enrollment-helpers';

// GET /api/parent/overview
// Everything a parent needs without logging in: per-course progress, quiz results,
// certificates, announcements and fee balances. Requires a parent session (see
// /api/parent/verify). Returns only what the parent needs (no email/phone/DOB).
export const dynamic = 'force-dynamic';

const RECENT_QUIZZES = 10;
const RECENT_ANNOUNCEMENTS = 5;

export async function GET(req: NextRequest) {
  const studentId = await getParentSession(req);
  if (!studentId) return NextResponse.json({ error: 'Session expired' }, { status: 401 });

  try {
    const student = await prisma.studentUser.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        enrollments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, courseId: true, courseName: true, paymentStatus: true, paymentPlan: true,
            amount: true, totalAmount: true, currency: true, createdAt: true,
            cohort: { select: { name: true, startDate: true, endDate: true } },
            installments: {
              orderBy: { installmentNo: 'asc' },
              select: { installmentNo: true, amount: true, dueDate: true, status: true, paidAt: true },
            },
          },
        },
        quizAttempts: {
          orderBy: { createdAt: 'desc' },
          take: RECENT_QUIZZES,
          select: { scorePct: true, passed: true, createdAt: true, quiz: { select: { title: true } } },
        },
        certificates: {
          where: { revoked: false },
          orderBy: { issuedAt: 'desc' },
          select: { certificateNumber: true, courseName: true, issuedAt: true, verifyToken: true },
        },
      },
    });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const courseIds = [...new Set(student.enrollments.map((e) => e.courseId))];
    const [progress, announcements] = await Promise.all([
      getCourseProgress(student.id, courseIds),
      courseIds.length
        ? prisma.courseAnnouncement.findMany({
            where: { courseId: { in: courseIds } },
            orderBy: { createdAt: 'desc' },
            take: RECENT_ANNOUNCEMENTS,
            select: { title: true, body: true, createdAt: true, course: { select: { name: true } } },
          })
        : Promise.resolve([]),
    ]);

    const now = new Date();
    const enrollments = student.enrollments.map((e) => {
      const payments = summarizeEnrollmentPayments(e, e.installments, now);
      return {
        id: e.id.toString(),
        courseId: e.courseId,
        courseName: e.courseName,
        cohort: e.cohort,
        paymentStatus: e.paymentStatus,
        paymentPlan: e.paymentPlan ?? 'upfront',
        currency: e.currency,
        enrolledAt: e.createdAt,
        ...payments,
        installments: e.installments.map((i) => ({ ...i, overdue: i.status !== 'paid' && i.dueDate < now })),
        progress: progress.get(e.courseId) ?? null,
      };
    });

    return NextResponse.json({
      student: { id: student.id, firstName: student.fullName.split(' ')[0] },
      totals: {
        balance: enrollments.reduce((s, e) => s + e.remainingBalance, 0),
        overdue: enrollments.reduce((s, e) => s + e.overdueAmount, 0),
        currency: enrollments[0]?.currency ?? 'KES',
      },
      enrollments,
      recentQuizzes: student.quizAttempts.map((a) => ({
        title: a.quiz.title, scorePct: a.scorePct, passed: a.passed, takenAt: a.createdAt,
      })),
      certificates: student.certificates,
      announcements: announcements.map((a) => ({ title: a.title, body: a.body, courseName: a.course.name, postedAt: a.createdAt })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[parent/overview]', err);
    return NextResponse.json({ error: 'Could not load the overview' }, { status: 500 });
  }
}
