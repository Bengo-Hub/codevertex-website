import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/rbac';
import { digitikaPerm } from '@/lib/digitika-rbac-catalog';
import { resendPortalAccess } from '@/lib/portal-accounts';

type Ctx = { params: Promise<{ studentId: string }> };

const bodySchema = z.object({ who: z.enum(['student', 'parent']) });

const MESSAGES = {
  no_account: 'This person has no portal account yet.',
  claimed: 'They already set their own password. Send a password reset email from their account instead.',
  unavailable: 'Could not reissue the password right now. Try again in a moment.',
  not_published: 'The password was reissued but the message could not be queued. Run the resend again.',
} as const;

/**
 * POST /api/admin/students/{studentId}/resend-access  { who: 'student' | 'parent' }
 * Reissues the temporary password of a portal account the person has not taken over yet and
 * sends the credentials again by email and WhatsApp.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const guard = await requirePermission(req, digitikaPerm('students', 'manage'));
  if ('response' in guard) return guard.response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Choose the student or the parent.' }, { status: 400 });

  const result = await resendPortalAccess((await params).studentId.trim().toUpperCase(), parsed.data.who);
  if (result.ok) return NextResponse.json({ sent: true });
  const status = result.reason === 'no_account' ? 404 : result.reason === 'claimed' ? 409 : 502;
  return NextResponse.json({ error: MESSAGES[result.reason] }, { status });
}
