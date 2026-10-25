// Country codes the enrollment forms accept, with the local-number pattern each one validates.
// Shared by the public enrollment modal and the admin enrollment form so a phone is stored the
// same way whoever typed it.

export interface PhoneCountry {
  code: string;
  country: string;
  label: string;
  pattern: RegExp;
}

export const COUNTRY_CODES: PhoneCountry[] = [
  { code: '+254', country: 'KE', label: '🇰🇪 +254', pattern: /^(?:0|)?[17]\d{8}$/ },
  { code: '+255', country: 'TZ', label: '🇹🇿 +255', pattern: /^0?[67]\d{8}$/ },
  { code: '+256', country: 'UG', label: '🇺🇬 +256', pattern: /^0?[37]\d{8}$/ },
  { code: '+250', country: 'RW', label: '🇷🇼 +250', pattern: /^0?7\d{8}$/ },
  { code: '+251', country: 'ET', label: '🇪🇹 +251', pattern: /^0?9\d{8}$/ },
  { code: '+1', country: 'US', label: '🇺🇸 +1', pattern: /^\d{10}$/ },
  { code: '+44', country: 'GB', label: '🇬🇧 +44', pattern: /^0?[789]\d{9}$/ },
];

/** A local number is valid for a country when its digits match that country's pattern. */
export function isValidLocalPhone(cc: PhoneCountry, phone: string): boolean {
  return cc.pattern.test(phone.replace(/[\s\-()]/g, ''));
}

/** The international form stored on the enrollment: +254712345678. */
export function toInternationalPhone(cc: PhoneCountry, phone: string): string {
  return `${cc.code}${phone.replace(/[\s\-()]/g, '').replace(/^0/, '')}`;
}

/**
 * Normalises a phone typed in any common form to +<country><number>, or null when it is not a
 * usable number. "0712 345 678" and "712345678" are read as Kenyan; "+255 ..." and "254..." keep
 * their country code. Used by the contact form API, where the visitor types a free-form number.
 */
export function normalisePhone(raw: string): string | null {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  let intl: string;
  if (trimmed.startsWith('+') || trimmed.startsWith('00')) intl = digits.replace(/^00/, '');
  else if (/^0[17]\d{8}$/.test(digits)) intl = `254${digits.slice(1)}`;
  else if (/^[17]\d{8}$/.test(digits)) intl = `254${digits}`;
  else intl = digits;
  if (!/^[1-9]\d{8,14}$/.test(intl)) return null;
  const cc = COUNTRY_CODES.find((c) => intl.startsWith(c.code.slice(1)));
  if (cc && !isValidLocalPhone(cc, intl.slice(cc.code.length - 1))) return null;
  return `+${intl}`;
}
