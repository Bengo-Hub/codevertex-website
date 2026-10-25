import type { Metadata } from 'next';
import { PlatformEcosystemMap } from '@/components/platform/PlatformEcosystemMap';
import { PlatformAuditFindings } from '@/components/platform/PlatformAuditFindings';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export const metadata: Metadata = { title: 'Platform map' };

// Staff-only: how the Power Suite services connect, and the review of this website. Both used
// to be public at /platform; the architecture detail and open gaps are internal information.
export default function PlatformMapPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <AdminPageHeader title="Platform map" description="How the Power Suite services connect, and where this website stands" />
      <section id="ecosystem" className="mb-16">
        <PlatformEcosystemMap />
      </section>
      <section className="border-t border-border pt-10">
        <h2 className="text-xl font-bold text-foreground mb-2">Website review</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mb-8">
          Each gap raised in the last review of this site, checked against what is built across the platform.
        </p>
        <PlatformAuditFindings />
      </section>
    </div>
  );
}
