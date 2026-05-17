import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const sid = studentId.trim().toUpperCase();

    const student = await prisma.studentUser.findUnique({
      where: { id: sid },
      include: {
        enrollments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!student || student.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'No enrollment found for this Student ID.' },
        { status: 404 }
      );
    }

    const enrollment = student.enrollments[0];
    const invoiceRef = `DGT-${enrollment.id}-DGT-${student.id}`;

    return NextResponse.json({
      studentId: student.id,
      enrollmentId: enrollment.id.toString(),
      invoiceRef,
      courseName: enrollment.courseName,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
