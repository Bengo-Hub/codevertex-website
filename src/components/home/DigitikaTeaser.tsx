import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <section aria-labelledby="digitika-heading" className="bg-background px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5">
          <p className="text-sm font-semibold text-primary mb-3">Digitika Academy</p>
          <h2 id="digitika-heading" className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Learn the skills our clients hire for.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Courses in software engineering, networking, data, AI and digital skills, taught in Kisumu and online.
            Enrol online and pay by M-Pesa or card, in full or in instalments.
          </p>
          <div className="mt-8 relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
            <Image
              src="/images/photos/hackathon-laptops.webp"
              alt="Students coding on laptops at the MUCISA Hackathon 2025"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><Link href="/digitika#courses">Browse courses</Link></Button>
            <Button variant="outline" asChild><Link href="/contact?service=digitika">Training for your team</Link></Button>
          </div>
        </div>

        <ul className="lg:col-span-7 divide-y divide-border border-y border-border">
          {COURSE_CATEGORIES.map((cat) => {
            const n = counts.get(cat.id) ?? 0;
            return (
              <li key={cat.id}>
                <Link href={`/digitika?category=${cat.id}#courses`} className="group flex items-center justify-between gap-6 py-6 hover:bg-secondary/60 px-2 -mx-2 rounded-sm">
                  <span>
                    <span className="block font-semibold text-lg text-foreground group-hover:text-primary">{cat.name}</span>
                    <span className="block text-sm text-muted-foreground mt-1">{cat.tagline}</span>
                  </span>
                  <span className="flex items-center gap-3 shrink-0 text-sm text-muted-foreground">
                    {n > 0 && <span>{n} {n === 1 ? 'course' : 'courses'}</span>}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
