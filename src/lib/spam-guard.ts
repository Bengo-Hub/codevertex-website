export interface SpamCheckResult {
  blocked: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Disposable / throwaway email domains
// ---------------------------------------------------------------------------
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwaway.email',
  'temp-mail.org',
  'sharklasers.com',
  'guerrillamailblock.com',
  'yopmail.com',
  'trashmail.com',
  'maildrop.cc',
]);

// Free providers where bots abuse dotted local-parts
const DOTTED_LOCAL_PROVIDERS = new Set(['gmail.com', 'yahoo.com', 'hotmail.com']);

// ---------------------------------------------------------------------------
// Shannon entropy
// ---------------------------------------------------------------------------
function shannonEntropy(str: string): number {
  if (str.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] ?? 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// ---------------------------------------------------------------------------
// Case-transition ratio: consecutive chars where one is upper and next is lower
// or lower → upper (rapid alternation = bot-randomised case).
// ---------------------------------------------------------------------------
function caseTransitionRatio(str: string): number {
  if (str.length < 2) return 0;
  let transitions = 0;
  for (let i = 0; i < str.length - 1; i++) {
    const a = str[i];
    const b = str[i + 1];
    const aUp = a === a.toUpperCase() && a !== a.toLowerCase();
    const bUp = b === b.toUpperCase() && b !== b.toLowerCase();
    if (aUp !== bUp) transitions++;
  }
  return transitions / (str.length - 1);
}

// ---------------------------------------------------------------------------
// Gibberish check: high entropy + no spaces + length > 8
//   OR high case-transition ratio
// ---------------------------------------------------------------------------
function isGibberish(str: string): boolean {
  if (!str) return false;
  const hasSpaces = str.includes(' ');
  const len = str.length;

  if (!hasSpaces && len > 8) {
    const entropy = shannonEntropy(str);
    if (entropy > 3.5) return true;

    const ctr = caseTransitionRatio(str);
    if (ctr > 0.4) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Email checks
// ---------------------------------------------------------------------------

// Matches patterns like  a.4.61  — single letters or short digit sequences
// separated by dots, with at least one digit segment.
const DOTTED_DIGIT_RE = /(?:^|\.)([a-z]|\d{1,3})\.(\d+)(?:\.|$)/i;

function isEmailSuspicious(email: string): { suspicious: boolean; reason: string } {
  const atIdx = email.indexOf('@');
  if (atIdx === -1) return { suspicious: false, reason: '' };

  const local = email.slice(0, atIdx).toLowerCase();
  const domain = email.slice(atIdx + 1).toLowerCase();

  // Disposable domain
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { suspicious: true, reason: `Disposable email domain: ${domain}` };
  }

  // Dotted-local-part abuse on free providers
  if (DOTTED_LOCAL_PROVIDERS.has(domain)) {
    const dots = (local.match(/\./g) ?? []).length;
    if (dots > 3) {
      return {
        suspicious: true,
        reason: `Suspicious email: too many dots in local part (${dots})`,
      };
    }

    if (DOTTED_DIGIT_RE.test(local)) {
      return {
        suspicious: true,
        reason: 'Suspicious email: digit-embedded dotted pattern in local part',
      };
    }
  }

  return { suspicious: false, reason: '' };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function checkSpam(fields: {
  name?: string;
  email?: string;
  message?: string;
  phone?: string;
}): SpamCheckResult {
  const { name, email, message } = fields;

  // --- Name checks ---
  if (name) {
    // Single token (no space), length > 15, mixed case → gibberish bot name
    if (!name.includes(' ') && name.length > 15) {
      const hasMixedCase =
        name !== name.toLowerCase() && name !== name.toUpperCase();
      if (hasMixedCase) {
        return { blocked: true, reason: 'Suspicious name: gibberish (long single token with mixed case)' };
      }
    }
    // General gibberish check
    if (isGibberish(name)) {
      return { blocked: true, reason: 'Suspicious name: gibberish pattern detected' };
    }
  }

  // --- Email checks ---
  if (email) {
    const emailCheck = isEmailSuspicious(email);
    if (emailCheck.suspicious) {
      return { blocked: true, reason: emailCheck.reason };
    }
  }

  // --- Message checks ---
  if (message) {
    // No spaces and length > 15 → almost certainly a bot-generated string
    if (!message.includes(' ') && message.length > 15) {
      return { blocked: true, reason: 'Suspicious message: no spaces in long message' };
    }
    if (isGibberish(message)) {
      return { blocked: true, reason: 'Suspicious message: gibberish pattern detected' };
    }
  }

  return { blocked: false };
}
