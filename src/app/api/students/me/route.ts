import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveDigitikaSession } from '@/lib/auth/rbac';

export async function GET(req: NextRequest) {
  try {
    const session = await resolveDigitikaSession(req);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the local student using the logged-in account email.
    const student = await prisma.studentUser.findUnique({
      where: {
        email: session.email,
      },
      include: {
        enrollments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            installments: {
              orderBy: {
                installmentNo: 'asc',
              },
            },
            cohort: true,
          },
        },
        progress: true,
        quizAttempts: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        certificates: {
          where: {
            revoked: false,
          },
          orderBy: {
            issuedAt: 'desc',
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          error: 'Student account not found',
          email: session.email,
        },
        { status: 404 }
      );
    }

    const enrollment = student.enrollments[0] ?? null;

    return NextResponse.json({
      student: {
        id: student.id,
        email: student.email,
        fullName: student.fullName,
        phone: student.phone,
        createdAt: student.createdAt,
      },

      enrollment: enrollment
        ? {
            id: enrollment.id.toString(),
            courseId: enrollment.courseId,
            courseName: enrollment.courseName,
            category: enrollment.category,
            paymentStatus: enrollment.paymentStatus,
            paymentPlan: enrollment.paymentPlan,
            amount: enrollment.amount,
            totalAmount: enrollment.totalAmount,
            currency: enrollment.currency,
            cohort: enrollment.cohort
              ? {
                  id: enrollment.cohort.id.toString(),
                  name: enrollment.cohort.name,
                  startDate: enrollment.cohort.startDate,
                  endDate: enrollment.cohort.endDate,
                }
              : null,
            installments: enrollment.installments.map((item) => ({
              id: item.id.toString(),
              installmentNo: item.installmentNo,
              amount: item.amount,
              currency: item.currency,
              status: item.status,
              dueDate: item.dueDate,
              paidAt: item.paidAt,
            })),
          }
        : null,

      progress: student.progress.map((item) => ({
        lessonId: item.lessonId,
        completedAt: item.completedAt,
        lastPositionSec: item.lastPositionSec,
      })),

      quizAttempts: student.quizAttempts.map((item) => ({
        id: item.id,
        quizId: item.quizId,
        scorePct: item.scorePct,
        passed: item.passed,
        createdAt: item.createdAt,
      })),

      certificates: student.certificates.map((certificate) => ({
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        verifyToken: certificate.verifyToken,
        courseId: certificate.courseId,
        courseName: certificate.courseName,
        issuedAt: certificate.issuedAt,
      })),
    });
  } catch (error) {
    console.error('Student dashboard error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}