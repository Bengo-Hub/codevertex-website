import { NextRequest, NextResponse } from 'next/server';
import { clientIp, normalizeStudentId, requestParentCode, CODE_TTL_MINUTES } from '@/lib/parent-access';

// POST /api/parent/request-code  { studentId }
// Sends a one-time code to the contact details on file. See src/lib/parent-access.ts.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const studentId = normalizeStudentId(body?.studentId);
  if (!studentId) {
    return NextResponse.json({ error: 'Enter a valid Student ID, e.g. DGT-AB12CD34.' }, { status: 400 });
  }
  try {
    const result = await requestParentCode(studentId, clientIp(req));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ sent: true, channels: result.channels, ttlMinutes: CODE_TTL_MINUTES });
  } catch (err) {
    console.error('[parent/request-code]', err);
    return NextResponse.json({ error: 'Could not send a code right now. Please try again.' }, { status: 500 });
  }
}
