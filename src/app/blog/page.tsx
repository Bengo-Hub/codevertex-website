import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Newspaper } from 'lucide-react';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Insights on technology, business, and the future of African digital infrastructure.',
};

<<<<<<< HEAD
// Rendered per-request (same rationale as the digitika course page): the build stage
// has no live DATABASE_URL, so a statically-prerendered/ISR page here fails `next build`
// outright trying to reach a database that isn't there yet at image-build time.
export const dynamic = 'force-dynamic';
=======
export const revalidate = 300; // 5 min — posts are edited rarely, keep this cheap
>>>>>>> f0f752f (chore: SEO/legal/blog/CI polish pass, on top of the LMS content delivery work)

const CATEGORY_PALETTE = [
  'bg-primary/10 text-primary border-primary/20',
  'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'bg-muted text-muted-foreground border-border',
];

function categoryColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

function readTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

function formatDate(d: Date | null) {
  if (!d) return '';
  return d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
  });

  const [featured] = posts;

  return (
    <div className="pt-20">
      {/* Hero — theme-aware */}
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-100 h-75 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Blog</p>
              <h1 className="text-5xl sm:text-6xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] mb-4">
                Insights &amp; Stories
              </h1>
              <p className="text-white/70 dark:text-muted-foreground text-lg max-w-xl leading-relaxed">
                Technology, business, and the future of African digital infrastructure — from the team building it.
              </p>
            </div>
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="hidden lg:block relative rounded-2xl overflow-hidden h-48 border border-white/10 dark:border-foreground/10"
              >
                {featured.coverImage && (
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    className="object-cover opacity-70"
                    sizes="500px"
                  />
                )}
                <div className="absolute inset-0 bg-linear-to-r from-foreground/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  {featured.tags[0] && (
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${categoryColor(featured.tags[0])}`}>
                      {featured.tags[0]}
                    </span>
                  )}
                  <p className="text-sm font-bold text-white mt-2 line-clamp-2">{featured.title}</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <Newspaper className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-bold text-foreground">Nothing published yet</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon — new posts are on the way.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id.toString()}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                >
                  <div className="relative h-44 overflow-hidden bg-secondary/50">
                    {post.coverImage && (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-400"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-card/40 to-transparent" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      {post.tags[0] && (
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${categoryColor(post.tags[0])}`}>
                          {post.tags[0]}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.publishedAt)} · {readTime(post.content)} read
                      </span>
                    </div>
                    <h2 className="font-black text-foreground text-base leading-snug mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{post.excerpt}</p>
                    )}
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      Read more <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
