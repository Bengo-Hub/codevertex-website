import { randomInt, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { keyedHash, signScopedToken, verifyScopedToken } from '@/lib/auth/session-crypto';
import { sendParentAccessCode } from '@/lib/notifications';

/**
 * Parent / guardian portal access (no account needed).
 *
 * Flow: Student ID -> one-time 6-digit code sent to the contact details already on file
 * (email + SMS) -> short-lived signed session cookie scoped to that one student.
 *
 * Security and data-protection controls (Kenya Data Protection Act 2019 principles:
 * data minimisation, purpose limitation, security safeguards):
 *  - Knowing a Student ID alone reveals nothing beyond masked contact hints.
 *  - Codes are random (crypto), single-use, expire in CODE_TTL_MINUTES, are stored only
 *    as a keyed HMAC, and allow MAX_VERIFY_ATTEMPTS guesses before the code is burned.
 *  - Rate limits per student and per client IP (IP stored only as a keyed hash), backed
 *    by the DB so they hold across pods and restarts.
 *  - The session token is purpose-scoped (cannot be replayed as an admin/student session),
 *    httpOnly, SameSite=Strict, and expires after SESSION_TTL_MINUTES.
 *  - Every request and verification is a row in parent_access_codes (audit trail);
 *    rows older than RETENTION_DAYS are deleted.
 */

export const CODE_TTL_MINUTES = 5; // matches the wording of the shared auth OTP templates
export const SESSION_TTL_MINUTES = 30;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_CODES_PER_STUDENT_PER_HOUR = 3;
const MAX_REQUESTS_PER_IP_PER_HOUR = 10;
const RETENTION_DAYS = 30;

export const PARENT_COOKIE = 'cv_parent';
const TOKEN_PURPOSE = 'parent-portal';
const STUDENT_ID_RE = /^DGT-[A-Z0-9]{8}$/;

export function normalizeStudentId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const id = raw.trim().toUpperCase();
  return STUDENT_ID_RE.test(id) ? id : null;
}

/**
 * Client IP for rate limiting. Prefers X-Real-IP (set by the ingress, not forgeable by the
 * client), then the right-most X-Forwarded-For hop (appended by our proxy). The left-most
 * XFF entry is client-controlled and deliberately ignored.
 */
export function clientIp(req: NextRequest): string {
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const hops = req.headers.get('x-forwarded-for')?.split(',').map((h) => h.trim()).filter(Boolean) ?? [];
  return hops[hops.length - 1] || 'unknown';
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 1)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 4 ? `***${digits.slice(-3)}` : '***';
}

const hourAgo = () => new Date(Date.now() - 60 * 60 * 1000);

export type RequestCodeResult =
  | { ok: true; channels: string[] }
  | { ok: false; status: 404 | 429 | 422; error: string };

export async function requestParentCode(studentId: string, ip: string): Promise<RequestCodeResult> {
  const ipHash = await keyedHash('parent-ip', ip);

  // Opportunistic retention cleanup (indexed on created_at; usually deletes nothing).
  await prisma.parentAccessCode.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
  });

  const ipRequests = await prisma.parentAccessCode.count({ where: { ipHash, createdAt: { gte: hourAgo() } } });
  if (ipRequests >= MAX_REQUESTS_PER_IP_PER_HOUR) {
    return { ok: false, status: 429, error: 'Too many requests. Please try again in an hour.' };
  }

  const student = await prisma.studentUser.findUnique({
    where: { id: studentId },
    select: { id: true, fullName: true, email: true, phone: true },
  });

  if (!student) {
    // Recorded (without a student) so ID probing counts toward the IP limit and is audited.
    await prisma.parentAccessCode.create({
      data: { studentUserId: null, codeHash: '', ipHash, expiresAt: new Date() },
    });
    return { ok: false, status: 404, error: 'We could not find that Student ID. Check the ID on your enrollment email or receipt.' };
  }

  const studentRequests = await prisma.parentAccessCode.count({
    where: { studentUserId: student.id, createdAt: { gte: hourAgo() } },
  });
  if (studentRequests >= MAX_CODES_PER_STUDENT_PER_HOUR) {
    return { ok: false, status: 429, error: 'A code was already sent several times. Please use the latest code or try again in an hour.' };
  }

  const channels = [student.email && 'email', student.phone && 'sms'].filter(Boolean) as string[];
  if (channels.length === 0) {
    return { ok: false, status: 422, error: 'No contact details are on file for this student. Please contact us.' };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.parentAccessCode.create({
    data: {
      studentUserId: student.id,
      codeHash: await keyedHash('parent-code', `${student.id}:${code}`),
      ipHash,
      channels,
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
    },
  });

  await sendParentAccessCode({
    email: student.email || undefined,
    phone: student.phone || undefined,
    name: `Parent/guardian of ${student.fullName.split(' ')[0]}`,
    code,
    ttlMinutes: CODE_TTL_MINUTES,
  });

  return {
    ok: true,
    channels: [student.email && maskEmail(student.email), student.phone && maskPhone(student.phone)].filter(Boolean) as string[],
  };
}

export type VerifyCodeResult =
  | { ok: true; token: string; maxAgeSeconds: number }
  | { ok: false; status: 400 | 429; error: string };

export async function verifyParentCode(studentId: string, code: string): Promise<VerifyCodeResult> {
  const latest = await prisma.parentAccessCode.findFirst({
    where: { studentUserId: studentId, verifiedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) return { ok: false, status: 400, error: 'This code has expired. Request a new one.' };
  if (latest.attempts >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, status: 429, error: 'Too many incorrect attempts. Request a new code.' };
  }

  const expected = Buffer.from(latest.codeHash, 'hex');
  const actual = Buffer.from(await keyedHash('parent-code', `${studentId}:${code}`), 'hex');
  const match = expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!match) {
    await prisma.parentAccessCode.update({ where: { id: latest.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, status: 400, error: 'That code is not correct.' };
  }

  // Single use: mark verified (conditional on still unverified, so a race cannot reuse it).
  const claimed = await prisma.parentAccessCode.updateMany({
    where: { id: latest.id, verifiedAt: null },
    data: { verifiedAt: new Date(), attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return { ok: false, status: 400, error: 'This code was already used. Request a new one.' };

  const maxAgeSeconds = SESSION_TTL_MINUTES * 60;
  const token = await signScopedToken(TOKEN_PURPOSE, {
    sid: studentId,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  });
  return { ok: true, token, maxAgeSeconds };
}

/** Student ID bound to the caller's parent session, or null. */
export async function getParentSession(req: NextRequest): Promise<string | null> {
  const payload = await verifyScopedToken<{ sid: string; exp: number }>(TOKEN_PURPOSE, req.cookies.get(PARENT_COOKIE)?.value);
  return payload?.sid ?? null;
}

export function setParentCookie(res: NextResponse, token: string, maxAgeSeconds: number) {
  res.cookies.set(PARENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export function clearParentCookie(res: NextResponse) {
  res.cookies.set(PARENT_COOKIE, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
}
