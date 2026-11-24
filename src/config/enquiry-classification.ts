// Which contact messages are not sales leads (owner, 2026-11-24): people asking for attachment,
// an internship or a job, and businesses offering their own services. They go to the applications
// store, never to MarketFlow's leads. The lists are configuration: ENQUIRY_JOB_KEYWORDS and
// ENQUIRY_SERVICE_OFFER_KEYWORDS (comma separated) replace the defaults below.

export type EnquiryKind = 'lead' | 'attachment' | 'job' | 'service_offer';

const DEFAULT_ATTACHMENT_KEYWORDS = [
  'attachment application', 'industrial attachment', 'attachment opportunity', 'attachment place', 'attachment position',
  'for attachment', 'for an attachment', 'internship', ' intern ', 'student attachment',
];
const DEFAULT_JOB_KEYWORDS = [
  'job opportunity', 'vacancy', 'vacancies', 'employment', 'hire me', 'my cv', 'my resume', 'curriculum vitae',
  'joining codevertex', 'join your team', 'interested in joining', 'looking for a job', 'apply for a position', 'position of',
];
const DEFAULT_SERVICE_OFFER_KEYWORDS = [
  'hi agency owner', 'we are a web development company', 'we’re a web development company', "we're a web development company",
  'our services include', 'outsource', 'white label partner', 'seo services', 'we offer our services', 'projects for clients worldwide',
];

function list(env: string | undefined, fallback: string[]): string[] {
  const v = (env ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return v.length ? v : fallback;
}

export const ENQUIRY_KEYWORDS = {
  attachment: list(process.env.ENQUIRY_ATTACHMENT_KEYWORDS, DEFAULT_ATTACHMENT_KEYWORDS),
  job: list(process.env.ENQUIRY_JOB_KEYWORDS, DEFAULT_JOB_KEYWORDS),
  serviceOffer: list(process.env.ENQUIRY_SERVICE_OFFER_KEYWORDS, DEFAULT_SERVICE_OFFER_KEYWORDS),
};

/**
 * Classifies a contact or chat enquiry. The attachment form is always an attachment application;
 * otherwise the topic and message are matched against the keyword lists (case-insensitive).
 */
export function classifyEnquiry(
  input: { form?: string; service?: string | null; message?: string | null },
  keywords = ENQUIRY_KEYWORDS,
): EnquiryKind {
  if (input.form === 'attachment') return 'attachment';
  const text = ` ${(input.service ?? '').toLowerCase()} ${(input.message ?? '').toLowerCase()} `.replace(/\s+/g, ' ');
  const has = (words: string[]) => words.some((w) => text.includes(w));
  if (has(keywords.attachment)) return 'attachment';
  if (has(keywords.job)) return 'job';
  if (has(keywords.serviceOffer)) return 'service_offer';
  return 'lead';
}
