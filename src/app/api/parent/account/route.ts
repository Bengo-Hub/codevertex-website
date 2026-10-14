import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveDigitikaSession } from '@/lib/auth/rbac';
import { issueParentSession, normalizeStudentId, setParentCookie } from '@/lib/parent-access';

// Parent SSO accounts (role parent, created for the guardian of a learner under 18; see
// src/lib/portal-accounts.ts). A signed-in parent is matched to children by the guardian
// email on each student record, then opens one child with the same parent session the
// one-time code gives, so the overview and pay routes stay the only parent data paths.

async function guardianEmail(req: NextRequest): Promise<string | null> {
  const session = await resolveDigitikaSession(req);
  return session?.email ? session.email.trim().toLowerCase() : null;
}

// GET /api/parent/account: the signed-in parent's children (names and IDs only).
export async function GET(req: NextRequest) {
  const email = await guardianEmail(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const children = await prisma.studentUser.findMany({
    where: { guardianEmail: email },
    orderBy: { fullName: 'asc' },
    take: 20,
    select: { id: true, fullName: true },
  });
  return NextResponse.json({ children }, { headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/parent/account { studentId }: open that child's parent session.
export async function POST(req: NextRequest) {
  const email = await guardianEmail(req);
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const studentId = normalizeStudentId(body?.studentId);
  if (!studentId) return NextResponse.json({ error: 'Invalid student' }, { status: 400 });

  const child = await prisma.studentUser.findFirst({
    where: { id: studentId, guardianEmail: email },
    select: { id: true },
  });
  // Same answer for "no such student" and "not your child": nothing to enumerate.
  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { token, maxAgeSeconds } = await issueParentSession(child.id);
  const res = NextResponse.json({ ok: true, expiresInSeconds: maxAgeSeconds });
  setParentCookie(res, token, maxAgeSeconds);
  return res;
}
