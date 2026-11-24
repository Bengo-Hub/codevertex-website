'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureAttribution } from '@/lib/attribution';

/** Keeps the ad click ids and UTM tags of the page a visitor lands on (src/lib/attribution.ts). */
export function AttributionCapture() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    captureAttribution(search?.toString() ?? '');
  }, [pathname, search]);
  return null;
}
