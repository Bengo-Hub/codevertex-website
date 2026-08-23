import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

// Rendered per-request: the build stage has no live DATABASE_URL, so a statically
// generated sitemap here fails `next build` outright trying to reach a database
// that isn't there yet at image-build time (same fix as /blog's list page).
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://codevertexafrica.com';

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/services', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/digitika', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/platform', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'daily' },
  { path: '/careers', priority: 0.6, changeFrequency: 'daily' },
  { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/security', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms-of-service', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, posts] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const courseEntries: MetadataRoute.Sitemap = courses.map((c) => ({
    url: `${BASE_URL}/digitika/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...courseEntries, ...blogEntries];
}
