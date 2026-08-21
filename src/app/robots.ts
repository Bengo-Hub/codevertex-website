import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/digitika/my-enrollment', '/digitika/success', '/auth'],
      },
    ],
    sitemap: 'https://codevertexafrica.com/sitemap.xml',
  };
}
