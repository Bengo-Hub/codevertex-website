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

    const student = await prisma.studentUser.findUnique({
      where: {
        id: session.userId,
      },
      include: {
        enrollments: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            installments: {
              orderBy: {
                installmentNo: 'asc',
              },
            },
          },
        },
        progress: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                moduleId: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        quizAttempts: {
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                lessonId: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
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
          error: 'Student profile not found',
          studentId: session.userId,
        },
        { status: 404 }
      );
    }

    const completedLessons = student.progress.filter(
      (p) => p.completedAt !== null
    ).length;

    const courses = student.enrollments.map((enrollment) => ({
      id: enrollment.id.toString(),
      courseId: enrollment.courseId,
      courseName: enrollment.courseName,
      category: enrollment.category,
      paymentStatus: enrollment.paymentStatus,
      paymentPlan: enrollment.paymentPlan,
      amount: enrollment.amount,
      totalAmount: enrollment.totalAmount,
      currency: enrollment.currency,
      createdAt: enrollment.createdAt,
      installments: enrollment.installments.map((item) => ({
        id: item.id.toString(),
        installmentNo: item.installmentNo,
        amount: item.amount,
        currency: item.currency,
        dueDate: item.dueDate,
        status: item.status,
        paidAt: item.paidAt,
      })),
    }));

    return NextResponse.json({
      student: {
        id: student.id,
        email: student.email,
        fullName: student.fullName,
        phone: student.phone,
      },

      stats: {
        courses: courses.length,
        completedLessons,
        quizAttempts: student.quizAttempts.length,
        certificates: student.certificates.length,
      },

      courses,

      progress: student.progress.map((item) => ({
        id: item.id,
        lessonId: item.lessonId,
        lessonTitle: item.lesson.title,
        moduleId: item.lesson.moduleId,
        completedAt: item.completedAt,
        lastPositionSec: item.lastPositionSec,
        updatedAt: item.updatedAt,
      })),

      recentQuizzes: student.quizAttempts.map((attempt) => ({
        id: attempt.id,
        title: attempt.quiz.title,
        scorePct: attempt.scorePct,
        passed: attempt.passed,
        createdAt: attempt.createdAt,
      })),

      certificates: student.certificates.map((certificate) => ({
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        courseId: certificate.courseId,
        courseName: certificate.courseName,
        issuedAt: certificate.issuedAt,
        verifyToken: certificate.verifyToken,
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