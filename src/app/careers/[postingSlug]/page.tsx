import type { Metadata } from 'next';
import { CareersPostingDetail } from '@bengo-hub/shared-ui-lib/careers';
import { ERP } from '@/lib/constants';

export const metadata: Metadata = { title: 'Job Opening', description: 'Open position at Codevertex Africa Limited.' };

// Live data from erp-api — never statically prerender.
export const dynamic = 'force-dynamic';

export default async function CareersDetailPage({ params }: { params: Promise<{ postingSlug: string }> }) {
  const { postingSlug } = await params;

  return (
    <div className="pt-20">
      <CareersPostingDetail
        orgSlug={ERP.tenant}
        postingSlug={postingSlug}
        apiBaseUrl={ERP.apiBaseUrl}
        backHref="/careers"
        poweredByHref="/services"
      />
    </div>
  );
}
