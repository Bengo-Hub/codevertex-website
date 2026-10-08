import type { Metadata } from 'next';
import { CareersPostingDetailClient } from '@/components/careers/CareersClient';

export const metadata: Metadata = { title: 'Job Opening', description: 'Open position at Codevertex Africa Limited.' };

// Posting data is fetched in the browser from erp-api by CareersPostingDetailClient.
export const dynamic = 'force-dynamic';

export default async function CareersDetailPage({ params }: { params: Promise<{ postingSlug: string }> }) {
  const { postingSlug } = await params;

  return (
    <div className="pt-20">
      <CareersPostingDetailClient postingSlug={postingSlug} />
    </div>
  );
}
