import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { renderCertificatePdf } from '@/lib/certificate-pdf';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const cert = await prisma.certificate.findUnique({ where: { verifyToken: token } });
  if (!cert || cert.revoked) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  const verifyUrl = `${new URL(req.url).origin}/certificates/${cert.verifyToken}`;
  const pdfBytes = await renderCertificatePdf({
    certificateNumber: cert.certificateNumber,
    studentName: cert.studentName,
    courseName: cert.courseName,
    issuedAt: cert.issuedAt,
    verifyUrl,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${cert.certificateNumber}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
