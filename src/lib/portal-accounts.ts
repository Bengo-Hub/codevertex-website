/**
 * Digitika portal accounts. Once an enrollment is confirmed (first payment cleared, a free
 * course, or an admin marking it paid) the learner gets an SSO account with the `student` role
 * in the platform tenant, and a learner under 18 also gets their guardian a `parent` account.
 * Both sign in through accounts.codevertexafrica.com like everyone else; a new account gets a
 * temporary password by email and must replace it on first sign-in (auth-api
 * must_change_password).
 *
 * auth-api owns the accounts. This only asks it, through the S2S member endpoint that creates
 * or links a user by email and returns the real auth user id (never a locally minted one).
 * Roles stay separate: student and parent here, staff roles only through the admin Users page.
 */

import { prisma } from '@/lib/db';
import { AUTH_API_URL, resolvePlatformTenantId } from '@/lib/auth/rbac';
import { sendPortalAccount } from '@/lib/notifications';
import { isPlaceholderEmail } from '@/lib/learner-rules';

const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codevertexafrica.com';
const STUDENT_LOGIN_URL = `${SITE_URL}/student`;
// Parents use the parent portal, which takes either their account or a one-time code.
const PARENT_LOGIN_URL = `${SITE_URL}/digitika/parent`;

export const STUDENT_ROLE = 'student';
export const PARENT_ROLE = 'parent';

const CONFIRMED = new Set(['succeeded', 'paid']);

interface MemberResult {
  userId: string;
  tempPassword?: string;
}

async function addPortalMember(
  tenantId: string,
  person: { email: string; name: string; phone?: string | null },
  role: string,
  requestId: string,
): Promise<MemberResult | null> {
  const res = await fetch(`${AUTH_API_URL}/api/v1/s2s/tenants/${tenantId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': SERVICE_KEY,
      'X-Request-ID': requestId,
    },
    body: JSON.stringify({
      email: person.email,
      name: person.name,
      phone: person.phone || undefined,
      roles: [role],
      // A learner who is also staff keeps their staff roles.
      merge_roles: true,
      // Our own email carries the credentials; skip the generic welcome.
      skip_welcome: true,
    }),
  });
  if (!res.ok) {
    console.error(`[portal-accounts] add ${role} failed (${res.status}): ${await res.text().catch(() => '')}`);
    return null;
  }
  const body = (await res.json()) as { user_id?: string; temp_password?: string };
  if (!body.user_id) return null;
  return { userId: body.user_id, tempPassword: body.temp_password || undefined };
}

// One provisioning run per student at a time in this process: the treasury subscriber and the
// admin route can fire for the same learner within moments of each other.
const inFlight = new Set<string>();

/**
 * Creates the student account (and the parent account for a minor) for a confirmed
 * enrollment. Safe to call more than once: a student already holding an ssoUserId, or a child
 * whose guardian already has an account, is skipped, and the claim on the row is conditional
 * so two runs never both send credentials.
 */
export async function provisionEnrollmentAccounts(enrollmentId: bigint, requestId = crypto.randomUUID()): Promise<void> {
  if (!SERVICE_KEY) {
    console.warn('[portal-accounts] INTERNAL_SERVICE_KEY not set, skipping portal accounts');
    return;
  }
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { studentUser: true },
  });
  const student = enrollment?.studentUser;
  if (!enrollment || !student || !CONFIRMED.has(enrollment.paymentStatus)) return;

  // A child with no email of their own gets no sign-in account; their parent follows them in
  // the parent portal.
  const needsStudent = !student.ssoUserId && !isPlaceholderEmail(student.email);
  const needsParent = !!student.guardianEmail && !student.guardianSsoUserId;
  if (!needsStudent && !needsParent) return;
  if (inFlight.has(student.id)) return;
  inFlight.add(student.id);

  try {
    const tenantId = await resolvePlatformTenantId();
    if (!tenantId) {
      console.error('[portal-accounts] platform tenant id unavailable');
      return;
    }

    if (needsStudent) {
      const member = await addPortalMember(tenantId, { email: student.email, name: student.fullName, phone: student.phone }, STUDENT_ROLE, requestId);
      if (member) {
        const claimed = await prisma.studentUser.updateMany({
          where: { id: student.id, ssoUserId: null },
          data: { ssoUserId: member.userId },
        });
        if (claimed.count === 1) {
          await sendPortalAccount({
            to: student.email,
            name: student.fullName,
            role: 'student',
            courseName: enrollment.courseName,
            studentName: student.fullName,
            tempPassword: member.tempPassword,
            loginUrl: STUDENT_LOGIN_URL,
          }, requestId);
        }
      }
    }

    if (needsParent && student.guardianEmail) {
      const guardianName = student.guardianName || student.guardianEmail;
      const member = await addPortalMember(tenantId, { email: student.guardianEmail, name: guardianName, phone: student.guardianPhone }, PARENT_ROLE, requestId);
      if (member) {
        const claimed = await prisma.studentUser.updateMany({
          where: { id: student.id, guardianSsoUserId: null },
          data: { guardianSsoUserId: member.userId },
        });
        if (claimed.count === 1) {
          await sendPortalAccount({
            to: student.guardianEmail,
            name: guardianName,
            role: 'parent',
            courseName: enrollment.courseName,
            studentName: student.fullName,
            tempPassword: member.tempPassword,
            loginUrl: PARENT_LOGIN_URL,
          }, requestId);
        }
      }
    }
  } finally {
    inFlight.delete(student.id);
  }
}
