import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { JsonLd, articleJsonLd } from '@/lib/json-ld';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  return prisma.blogPost.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || !post.published) return { title: 'Post not found' };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
      type: 'article',
    },
  };
}

function readTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) notFound();

  return (
    <div className="pt-20">
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          excerpt: post.excerpt,
          slug: post.slug,
          author: post.author,
          coverImage: post.coverImage,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
        })}
      />
      <section className="bg-foreground pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 dark:text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
          </Link>
          {post.tags[0] && (
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-primary/10 text-primary border-primary/20">
              {post.tags[0]}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-black text-white dark:text-foreground tracking-tight leading-tight mt-4 mb-4">
            {post.title}
          </h1>
          <p className="text-white/60 dark:text-muted-foreground text-sm">
            By {post.author} ·{' '}
            {post.publishedAt?.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
            {readTime(post.content)} read
          </p>
        </div>
      </section>

      {post.coverImage && (
        <div className="max-w-4xl mx-auto -mt-8 px-4 sm:px-6 lg:px-8">
          <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden border border-border">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="900px" priority />
          </div>
        </div>
      )}

      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </article>
      </section>
    </div>
  );
}
