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
    <>
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
      <header className="bg-background px-4 sm:px-6 lg:px-8 pt-28 lg:pt-36 pb-10">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-4">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All posts
          </Link>
          {post.tags[0] && <p className="mt-6 text-sm font-medium text-primary">{post.tags[0]}</p>}
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">{post.title}</h1>
          <p className="mt-4 text-muted-foreground">
            {post.author} · {post.publishedAt?.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })} · {readTime(post.content)} read
          </p>
        </div>
      </header>

      {post.coverImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-16/9 rounded-lg overflow-hidden bg-secondary">
            <Image src={post.coverImage} alt="" fill className="object-cover" sizes="(min-width: 1024px) 900px, 100vw" priority />
          </div>
        </div>
      )}

      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto prose prose-lg prose-neutral dark:prose-invert prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </article>
      </section>
    </>
  );
}
