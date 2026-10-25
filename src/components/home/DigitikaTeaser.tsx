import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/site/Reveal';
import { CountUp } from '@/components/site/CountUp';
import { COURSE_CATEGORIES } from '@/config/courses';
import { prisma } from '@/lib/db';

async function activeCourseCounts(): Promise<Map<string, number>> {
  try {
    const rows = await prisma.course.groupBy({
      by: ['categoryId'],
      where: { isActive: true },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.categoryId, r._count._all]));
  } catch {
    // DB unreachable (e.g. at build time): render the categories without counts.
    return new Map();
  }
}

export async function DigitikaTeaser() {
  const counts = await activeCourseCounts();
  return (
    <section id="digitika" aria-labelledby="digitika-heading" className="scroll-mt-20 bg-background px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-12 lg:items-center">
        <Reveal className="lg:col-span-6 relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-4xl shadow-lift">
            <Image src="/images/photos/hackathon-laptops.webp" alt="Students coding on laptops at the MUCISA Hackathon 2025" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="glass absolute -bottom-6 left-4 sm:left-8 right-4 sm:right-auto rounded-2xl px-5 py-4 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-foreground"><CountUp value={200} suffix="+" /> staff and <CountUp value={120} suffix="+" /> students trained</span>
              <span className="block text-sm text-muted-foreground">ICDL, coding and digital skills</span>
            </span>
          </div>
        </Reveal>

        <div className="lg:col-span-6 lg:pl-4 pt-6 lg:pt-0">
          <Reveal>
            <p className="text-sm font-semibold text-primary">Digitika Academy</p>
            <h2 id="digitika-heading" className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Learn the skills our clients hire for.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Courses in software engineering, networking, data, AI and digital skills, in class and online. Pay by M-Pesa or
              card, in full or in instalments.
            </p>
          </Reveal>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {COURSE_CATEGORIES.map((cat, i) => {
              const n = counts.get(cat.id) ?? 0;
              return (
                <Reveal key={cat.id} as="li" delay={i * 60}>
                  <Link href={`/digitika?category=${cat.id}#courses`} className="group flex items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3 transition-colors hover:bg-accent">
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground truncate">{cat.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">{n > 0 ? `${n} ${n === 1 ? 'course' : 'courses'}` : cat.tagline}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                  </Link>
                </Reveal>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-full" asChild><Link href="/digitika#courses">Browse courses</Link></Button>
            <Button variant="outline" className="rounded-full" asChild><Link href="/contact?service=digitika">Training for your team</Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
