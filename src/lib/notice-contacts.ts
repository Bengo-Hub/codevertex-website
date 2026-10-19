// Who a Digitika notification is for. Pure, so the rules are tested without a database.
//
// Every notice goes to the learner and, when there is one, the parent or guardian, each on the
// contacts they have (notifications-api digitika consumer, shared notify-parties rules). A child
// often has no email or phone of their own: their record carries a placeholder email, which is
// never put on an event, so the learner is simply not reachable by email and the guardian is.

import { isPlaceholderEmail } from '@/lib/learner-rules';

export interface StudentContacts {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
}

/** The people fields every learner notice event carries. */
export interface NoticePeople {
  studentId: string;
  studentName: string;
  /** Real address only; empty for a child with none. */
  studentEmail: string;
  studentPhone: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
}

export function noticePeople(s: StudentContacts): NoticePeople {
  return {
    studentId: s.id,
    studentName: s.fullName,
    studentEmail: isPlaceholderEmail(s.email) ? '' : s.email,
    studentPhone: (s.phone ?? '').trim(),
    guardianName: (s.guardianName ?? '').trim(),
    guardianEmail: (s.guardianEmail ?? '').trim().toLowerCase(),
    guardianPhone: (s.guardianPhone ?? '').trim(),
  };
}

/**
 * Where the parent portal one-time code goes: the guardian's contacts when the learner has a
 * guardian on record (the portal is theirs), else the learner's own. A code is never sent to a
 * placeholder address.
 */
export function accessCodeContacts(s: StudentContacts): { email: string; phone: string; who: 'guardian' | 'student' } {
  const g = (s.guardianEmail ?? '').trim() || (s.guardianPhone ?? '').trim();
  if (g) return { email: (s.guardianEmail ?? '').trim().toLowerCase(), phone: (s.guardianPhone ?? '').trim(), who: 'guardian' };
  return {
    email: isPlaceholderEmail(s.email) ? '' : s.email,
    phone: (s.phone ?? '').trim(),
    who: 'student',
  };
}
