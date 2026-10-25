import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { PageIntro } from '@/components/site/PageIntro';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Notes from the Codevertex team on business software, payments, tax, training and technology in Kenya.',
};

// Rendered per request: the build stage has no live DATABASE_URL.
export const dynamic = 'force-dynamic';

function readTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function formatDate(d: Date | null) {
  return d ? d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 60,
    select: { id: true, slug: true, title: true, excerpt: true, coverImage: true, tags: true, publishedAt: true, content: true },
  });

  return (
    <>
      <PageIntro eyebrow="Blog" title="Notes from the team" lead="Business software, payments, tax, training and the work we do on site." />

      <section className="bg-background px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          {posts.length === 0 ? (
            <p className="py-16 text-muted-foreground">No posts published yet.</p>
          ) : (
            <ul className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.id.toString()}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <div className="relative aspect-16/9 overflow-hidden rounded-3xl bg-secondary shadow-soft">
                      {post.coverImage && (
                        <Image src={post.coverImage} alt="" fill className="object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
                      )}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {post.tags[0] && <span className="text-primary font-medium">{post.tags[0]} · </span>}
                      {formatDate(post.publishedAt)} · {readTime(post.content)}
                    </p>
                    <h2 className="mt-1.5 font-display text-xl font-bold text-foreground leading-snug group-hover:text-primary">{post.title}</h2>
                    {post.excerpt && <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
