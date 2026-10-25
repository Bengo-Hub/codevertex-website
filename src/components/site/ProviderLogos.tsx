'use client';

// Official payment brand marks from shared-ui-lib (one source for every app). The package has no
// "use client" directive, so server pages render them through this client boundary.
import { AirtelMoneyLogo, MpesaLogo, PayHeroLogo, PaystackLogo } from '@bengo-hub/shared-ui-lib/payments';
import { cn } from '@/lib/utils';

const PROVIDERS = [
  { key: 'mpesa', name: 'M-Pesa', Logo: MpesaLogo },
  { key: 'airtel', name: 'Airtel Money', Logo: AirtelMoneyLogo },
  { key: 'payhero', name: 'PayHero', Logo: PayHeroLogo },
  { key: 'paystack', name: 'Paystack', Logo: PaystackLogo },
] as const;

/** A row of the payment providers our products collect through, as real brand logos. */
export function ProviderLogos({ className, tile = true }: { className?: string; tile?: boolean }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-3', className)} aria-label="Payment providers">
      {PROVIDERS.map((p) => (
        <li key={p.key} title={p.name} className={cn('flex h-12 items-center justify-center', tile && 'rounded-2xl bg-white px-4 shadow-soft ring-1 ring-border/60')}>
          {p.key === 'paystack' ? <PaystackLogo className="h-6 w-auto" title={p.name} wordmark /> : <p.Logo className="h-7 w-auto" title={p.name} />}
        </li>
      ))}
      <li title="KRA eTIMS" className={cn('flex h-12 items-center gap-2 px-4 text-sm font-semibold text-foreground', tile && 'rounded-2xl bg-white shadow-soft ring-1 ring-border/60')}>
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#b30d1f] text-[10px] font-bold text-white">KRA</span>
        eTIMS
      </li>
    </ul>
  );
}
