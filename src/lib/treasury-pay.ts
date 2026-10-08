import { TREASURY } from '@/lib/constants';

/**
 * Hosted-checkout link on treasury (books.codevertexafrica.com/pay). The reference id
 * format DGT-{enrollmentId}-DGT-{studentId} is what treasury-subscriber.ts parses to
 * credit the payment back to the enrollment. Shared by the receipt page and the parent portal.
 */
export function buildTreasuryPayUrl(p: {
  amount: number;
  currency: string;
  referenceId: string;
  description: string;
  redirectUrl: string;
  buttonText?: string;
  email?: string;
}): string {
  const params = new URLSearchParams({
    amount: String(p.amount),
    tenant: TREASURY.tenant,
    reference_id: p.referenceId,
    reference_type: 'digitika_enrollment',
    currency: p.currency,
    description: p.description,
    redirect_url: p.redirectUrl,
    button_text: p.buttonText ?? 'View My Enrollment',
    gateways: 'paystack,mpesa',
    email: p.email ?? '',
  });
  return `${TREASURY.payUrl}?${params}`;
}
