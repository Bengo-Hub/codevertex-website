import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Insights on technology, business, and the future of African digital infrastructure.',
};

const POSTS = [
  {
    id: 1,
    title: 'How TruLoad is Revolutionising Axle Load Compliance in East Africa',
    category: 'Product',
    date: 'Apr 2025',
    excerpt: "Real-time IoT monitoring combined with automated compliance reporting is transforming how Kenya's transport sector enforces axle load regulations.",
    readTime: '5 min',
    cover: '/images/illustrations/product-truload.svg',
  },
  {
    id: 2,
    title: 'The State of AI Adoption Among African SMEs in 2025',
    category: 'Insights',
    date: 'Mar 2025',
    excerpt: 'Our survey of 300+ East African businesses reveals the biggest barriers to AI adoption and how forward-thinking firms are closing the gap.',
    readTime: '8 min',
    cover: '/images/illustrations/product-vera.svg',
  },
  {
    id: 3,
    title: 'Why We Built Digitika Academy Alongside an IT Firm',
    category: 'Company',
    date: 'Feb 2025',
    excerpt: "Bridging the skills gap between education and industry was not an afterthought — it was always central to the Codevertex mission.",
    readTime: '6 min',
    cover: '/images/students.jpg',
  },
  {
    id: 4,
    title: 'OAuth 2.0 + OpenID Connect: Why SSO Is Non-Negotiable for Modern SaaS',
    category: 'Technical',
    date: 'Jan 2025',
    excerpt: 'A deep dive into how the Codevertex identity platform enables seamless, secure access across our entire product suite.',
    readTime: '10 min',
    cover: '/images/illustrations/product-isp.svg',
  },
  {
    id: 5,
    title: "From Legacy to Agile: Danka Africa's Digital Transformation Journey",
    category: 'Case Study',
    date: 'Dec 2024',
    excerpt: "How Codevertex delivered end-to-end digital transformation for one of East Africa's leading energy companies.",
    readTime: '7 min',
    cover: '/images/illustrations/product-erp.svg',
  },
  {
    id: 6,
    title: 'Top 5 In-Demand Tech Skills in Kenya for 2025',
    category: 'Academy',
    date: 'Nov 2024',
    excerpt: 'Data analytics, cloud engineering, AI/ML, full-stack web dev, and cybersecurity dominate employer demand.',
    readTime: '5 min',
    cover: '/images/courses/data-python.jpg',
  },
];

const CAT_COLORS: Record<string, string> = {
  Product:     'bg-primary/10 text-primary border-primary/20',
  Insights:    'bg-primary/10 text-primary border-primary/20',
  Company:     'bg-muted text-muted-foreground border-border',
  Technical:   'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  'Case Study':'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Academy:     'bg-primary/10 text-primary border-primary/20',
};

export default function BlogPage() {
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
            {/* Featured post preview */}
            <div className="hidden lg:block relative rounded-2xl overflow-hidden h-48 border border-white/10 dark:border-foreground/10">
              <Image
                src={POSTS[0].cover}
                alt={POSTS[0].title}
                fill
                className="object-cover opacity-70"
                sizes="500px"
              />
              <div className="absolute inset-0 bg-linear-to-r from-foreground/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${CAT_COLORS[POSTS[0].category]}`}>{POSTS[0].category}</span>
                <p className="text-sm font-bold text-white mt-2 line-clamp-2">{POSTS[0].title}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTS.map(post => (
            <article
              key={post.id}
              className="group flex flex-col rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
              <div className="relative h-44 overflow-hidden bg-secondary/50">
                <Image
                  src={post.cover}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-400"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-card/40 to-transparent" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${CAT_COLORS[post.category] ?? CAT_COLORS.Product}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.date} · {post.readTime} read</span>
                </div>
                <h2 className="font-black text-foreground text-base leading-snug mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{post.excerpt}</p>
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  Read more <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
