import { SITE } from '@/lib/constants';

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/images/logo.png`,
    description: SITE.tagline,
    email: SITE.email,
    telephone: SITE.phone1,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address,
      addressCountry: 'KE',
    },
    sameAs: [SITE.socials.linkedin, SITE.socials.twitter],
  };
}

interface CourseJsonLdInput {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: string | null;
}

export function courseJsonLd(course: CourseJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: SITE.name,
      sameAs: SITE.url,
    },
    url: `${SITE.url}/digitika/${course.id}`,
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      price: course.price,
      priceCurrency: 'KES',
      availability: 'https://schema.org/InStock',
    },
    ...(course.duration
      ? {
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'Blended',
            courseWorkload: course.duration,
          },
        }
      : {}),
  };
}

interface ArticleJsonLdInput {
  title: string;
  excerpt?: string | null;
  slug: string;
  author: string;
  coverImage?: string | null;
  publishedAt: Date | null;
  updatedAt?: Date | null;
}

export function articleJsonLd(post: ArticleJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    url: `${SITE.url}/blog/${post.slug}`,
    image: post.coverImage ? `${SITE.url}${post.coverImage}` : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: (post.updatedAt ?? post.publishedAt)?.toISOString(),
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/images/logo.png`,
      },
    },
  };
}

/** Renders a JSON-LD <script> tag. Use inside a Server Component. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD requires raw script injection; input is server-built from trusted DB/constants data, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
