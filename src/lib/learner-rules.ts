// Who may enrol in a course and who must vouch for them. Pure, so the public checkout, the admin
// enrollment form and both API routes apply the very same rules.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Payment statuses that make an enrollment confirmed; a student cannot take the same course twice. */
export const ACTIVE_ENROLLMENT_STATUSES = ['succeeded', 'paid'];

export interface AgeRange {
  min: number;
  max: number;
}

/** The ages a course accepts, read from its audience text ("Age 6-10", "Adults"), or null for no limit. */
export function getAgeRange(audience?: string | null): AgeRange | null {
  if (!audience) return null;
  const m = audience.match(/Age\s+(\d+)[–-](\d+)/i) ?? audience.match(/(\d+)[–-](\d+)/);
  if (m) return { min: parseInt(m[1], 10), max: parseInt(m[2], 10) };
  if (/adult/i.test(audience)) return { min: 16, max: 99 };
  return null;
}

/** Age in whole years on a day, or null without a valid date of birth (YYYY-MM-DD). */
export function ageOn(dob?: string | null, today = new Date()): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  return (
    today.getFullYear() -
    birth.getFullYear() -
    (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)
  );
}

/** True when a date of birth puts the learner under 18 today. */
export function isUnder18(dob?: string | null, today = new Date()): boolean {
  const age = ageOn(dob, today);
  return age !== null && age < 18;
}

/**
 * The reason a learner cannot take a course because of their age, or '' when they can. A course
 * with an age limit needs a date of birth; one without needs nothing.
 */
export function ageProblem(dob: string | null | undefined, audience?: string | null, today = new Date()): string {
  const range = getAgeRange(audience);
  if (!range) return '';
  const age = ageOn(dob, today);
  if (age === null) return `This course is for ages ${range.min}-${range.max}, so a date of birth is needed.`;
  if (age < range.min || age > range.max) {
    return `This course is for ages ${range.min}-${range.max}. Calculated age: ${age}.`;
  }
  return '';
}

export interface GuardianDetails {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

/**
 * The reason a parent or guardian is unacceptable, or '' when fine. Learners under 18 need a name
 * and their own guardian email (never the learner's); adults need none. A guardian given for an
 * adult is still checked for the email clash.
 */
export function guardianProblem(
  learnerEmail: string,
  minor: boolean,
  guardian: GuardianDetails | null | undefined,
): string {
  const name = (guardian?.name ?? '').trim();
  const email = (guardian?.email ?? '').trim().toLowerCase();
  if (minor && (!name || !EMAIL_RE.test(email))) {
    return "Add the parent or guardian's name and a valid email.";
  }
  if (email && email === learnerEmail.trim().toLowerCase()) {
    return "Use the parent or guardian's own email, not the learner's.";
  }
  return '';
}

// A child often has no email of their own. Their record still needs a unique one (students are
// looked up by it), so it gets a placeholder that encodes the student ID; mail for it goes to
// the parent or guardian instead, and no student sign-in account is made for it.
export const PLACEHOLDER_EMAIL_DOMAIN = 'no-email.invalid';

export function placeholderEmail(studentId: string): string {
  return `${studentId.toLowerCase()}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

export function isPlaceholderEmail(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
}

/** The student ID (DGT-XXXXXXXX) a placeholder email stands for, or null for a real email. */
export function studentIdOfPlaceholder(email?: string | null): string | null {
  if (!isPlaceholderEmail(email)) return null;
  return email!.trim().split('@')[0].toUpperCase();
}

/**
 * The reason a learner's own email or phone is required, or '' when fine. Adults need both;
 * a learner under 18 needs neither, because the parent or guardian is the contact.
 */
export function contactProblem(minor: boolean, email?: string | null, phone?: string | null): string {
  if (minor) return '';
  if (!(email ?? '').trim()) return 'An email is needed for learners 18 and over.';
  if (!(phone ?? '').trim()) return 'A phone number is needed for learners 18 and over.';
  return '';
}

/** Where mail for a learner goes: their own email, or the guardian's when theirs is a placeholder. */
export function contactEmailOf(email: string, guardianEmail?: string | null): string {
  return isPlaceholderEmail(email) && guardianEmail ? guardianEmail : email;
}

/** An email for display: a placeholder reads as "No own email" instead of a made-up address. */
export function displayEmail(email: string): string {
  return isPlaceholderEmail(email) ? 'No own email (parent is the contact)' : email;
}
