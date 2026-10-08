import { NextRequest, NextResponse } from 'next/server';
import { normalizeStudentId, setParentCookie, verifyParentCode } from '@/lib/parent-access';

// POST /api/parent/verify  { studentId, code }
// Exchanges a valid one-time code for a short-lived, httpOnly parent session cookie.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const studentId = normalizeStudentId(body?.studentId);
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (!studentId || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the 6-digit code we sent you.' }, { status: 400 });
  }
  try {
    const result = await verifyParentCode(studentId, code);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const res = NextResponse.json({ ok: true, expiresInSeconds: result.maxAgeSeconds });
    setParentCookie(res, result.token, result.maxAgeSeconds);
    return res;
  } catch (err) {
    console.error('[parent/verify]', err);
    return NextResponse.json({ error: 'Could not verify the code. Please try again.' }, { status: 500 });
  }
}
