import type { Metadata } from 'next';
import { CareersListingClient } from '@/components/careers/CareersClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Careers', description: 'Join Codevertex Africa Limited and build Africa\'s digital future.' };

// Job data is fetched in the browser from erp-api by CareersListingClient.
export const dynamic = 'force-dynamic';

export default function CareersPage() {
  return (
    <div className="pt-20">
      <section className="pt-8 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <div>
              <p className="font-bold text-foreground mb-1">Student or recent graduate?</p>
              <p className="text-sm text-muted-foreground">Apply for an industrial attachment or internship across 17 tracks.</p>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/careers/attachment">Attachment programme →</Link>
            </Button>
          </div>
        </div>
      </section>

      <CareersListingClient subtitle="Join a purpose-driven team building the infrastructure for Africa's digital economy." />

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
