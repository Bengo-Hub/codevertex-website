import type { Metadata } from 'next';
import { CareersListing } from '@bengo-hub/shared-ui-lib/careers';
import { Button } from '@/components/ui/button';
import { ERP } from '@/lib/constants';

export const metadata: Metadata = { title: 'Careers', description: 'Join Codevertex Africa Limited and build Africa\'s digital future.' };

// Live data from erp-api — never statically prerender (also sidesteps a build-time SSR
// quirk in the shared careers-portal client component during static generation).
export const dynamic = 'force-dynamic';

export default function CareersPage() {
  return (
    <div className="pt-20">
      <CareersListing
        orgSlug={ERP.tenant}
        apiBaseUrl={ERP.apiBaseUrl}
        linkToPosting={(postingSlug) => `/careers/${postingSlug}`}
        subtitle="Join a purpose-driven team building the infrastructure for Africa's digital economy."
        poweredByHref="/services"
      />

      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border">
            <div>
              <p className="font-bold text-foreground mb-1">Don&apos;t see your role?</p>
              <p className="text-sm text-muted-foreground">Send us your CV and a short note about what you&apos;d like to build.</p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <a href="mailto:careers@codevertexafrica.com">Open application →</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
