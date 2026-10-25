import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CareersListingClient } from '@/components/careers/CareersClient';
import { Button } from '@/components/ui/button';
import { PageIntro } from '@/components/site/PageIntro';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Open roles and attachment places at Codevertex Africa Limited.',
};

// Job data is fetched in the browser from erp-api by CareersListingClient.
export const dynamic = 'force-dynamic';

export default function CareersPage() {
  return (
    <>
      <PageIntro
        title="Careers"
        lead="We hire engineers, field technicians, trainers and support staff for our office and client sites. Open roles are listed below as soon as they are posted."
        aside={
          <div className="relative aspect-4/3 overflow-hidden rounded-4xl shadow-lift">
            <Image src="/images/photos/hackathon-team-table.webp" alt="Members of the Codevertex team at the MUCISA Hackathon 2025" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
        }
      >
        <div className="rounded-lg border border-border p-5 max-w-xl">
          <p className="font-semibold text-foreground">Student or recent graduate?</p>
          <p className="text-sm text-muted-foreground mt-1">Apply for an industrial attachment or internship.</p>
          <Button className="mt-4" asChild><Link href="/careers/attachment">See attachment places</Link></Button>
        </div>
      </PageIntro>

      <section className="bg-background px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <CareersListingClient subtitle="Open roles at Codevertex Africa Limited" />
        </div>
      </section>

      <section className="bg-secondary px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-5xl mx-auto sm:flex sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Do not see your role?</h2>
            <p className="text-muted-foreground mt-1">Send your CV and a short note about the work you want to do.</p>
          </div>
          <Button variant="outline" className="mt-4 sm:mt-0 shrink-0" asChild>
            <a href="mailto:careers@codevertexafrica.com">Email careers@codevertexafrica.com</a>
          </Button>
        </div>
      </section>
    </>
  );
}
