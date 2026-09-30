'use client';

// The shared-ui-lib careers components use React hooks (useState/useEffect) but the
// published bundle has no "use client" directive. Importing them straight into a server
// component page crashes with "useState only works in Client Components" (HTTP 500).
// Rendering them from this client boundary fixes that.
//
// The listing needs a `linkToPosting` function; functions cannot be passed from a server
// component to a client component, so it is defined here rather than in the page.
import { CareersListing, CareersPostingDetail } from '@bengo-hub/shared-ui-lib/careers';
import { ERP } from '@/lib/constants';

export function CareersListingClient({ subtitle }: { subtitle?: string }) {
  return (
    <CareersListing
      orgSlug={ERP.tenant}
      apiBaseUrl={ERP.apiBaseUrl}
      linkToPosting={(postingSlug) => `/careers/${postingSlug}`}
      subtitle={subtitle}
      poweredByHref="/services"
    />
  );
}

export function CareersPostingDetailClient({ postingSlug }: { postingSlug: string }) {
  return (
    <CareersPostingDetail
      orgSlug={ERP.tenant}
      postingSlug={postingSlug}
      apiBaseUrl={ERP.apiBaseUrl}
      backHref="/careers"
      poweredByHref="/services"
    />
  );
}
