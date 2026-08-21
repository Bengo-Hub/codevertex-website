interface LeadScoreInput {
  email?: string | null;
  phone?: string | null;
  topic?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
  source?: string;
}

const HIGH_INTENT_SOURCES = new Set(['contact_form', 'referral', 'enrollment_inquiry']);

/**
 * Simple, transparent rule-based lead score (0-100). Not AI/ML — that kind
 * of scoring would live in the AI service (marketflow-ai/Vera), not here.
 * This just rewards the signals a sales rep would look for at a glance:
 * how reachable the lead is, how specific their interest is, and whether
 * they've already signalled scheduling intent.
 */
export function scoreLead(input: LeadScoreInput): number {
  let score = 0;

  if (input.email) score += 25;
  if (input.phone) score += 20;
  if (input.topic) score += 15;
  if (input.preferredTime) score += 20; // asked for a call time = real intent
  if (input.notes && input.notes.trim().length > 20) score += 10;
  if (input.source && HIGH_INTENT_SOURCES.has(input.source)) score += 10;

  return Math.min(100, score);
}
