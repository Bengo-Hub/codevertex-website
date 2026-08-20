import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const cert = await prisma.certificate.findUnique({ where: { verifyToken: token } });
  if (!cert || cert.revoked) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  // Deliberately minimal — public endpoint, don't leak email/enrollment internals.
  return NextResponse.json({
    valid: true,
    certificateNumber: cert.certificateNumber,
    studentName: cert.studentName,
    courseName: cert.courseName,
    issuedAt: cert.issuedAt,
  });
}
