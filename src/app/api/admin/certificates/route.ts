import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, digitikaPerm('certificates', 'view'));
  if ('response' in guard) return guard.response;

  const url = new URL(req.url);
  const search = url.searchParams.get('search')?.trim();
  const courseId = url.searchParams.get('courseId') ?? undefined;
  const includeRevoked = url.searchParams.get('includeRevoked') === 'true';

  const certificates = await prisma.certificate.findMany({
    where: {
      ...(courseId ? { courseId } : {}),
      ...(includeRevoked ? {} : { revoked: false }),
      ...(search
        ? {
            OR: [
              { studentName: { contains: search, mode: 'insensitive' } },
              { courseName: { contains: search, mode: 'insensitive' } },
              { certificateNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { issuedAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(certificates);
}
