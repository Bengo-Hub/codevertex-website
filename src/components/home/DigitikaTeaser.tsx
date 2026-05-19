import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COURSE_CATEGORIES } from '@/config/courses';

const PREVIEW_IMAGES = [
  { src: '/images/MUSICA%20HACKATHON/SPK_6504.jpg', alt: 'Instructor presenting at MUCISA Hackathon', className: 'col-span-2 row-span-1' },
  { src: '/images/MUSICA%20HACKATHON/SPK_6506.jpg', alt: 'Students at MUCISA Hackathon', className: 'col-span-1 row-span-1' },
  { src: '/images/MUSICA%20HACKATHON/SPK_6501.jpg', alt: 'Student coding at MUCISA Hackathon', className: 'col-span-1 row-span-1' },
];

export function DigitikaTeaser() {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Left — pitch + courses */}
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Digitika Academy</p>
            <h2 className="text-4xl sm:text-5xl font-black text-foreground leading-tight tracking-tight mb-5">
              Closing Africa&apos;s digital skills gap.
            </h2>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed mb-6">
              Industry-aligned certification programmes in ICT, networking, AI, software engineering
              and data analytics. Enroll online, pay securely via M-Pesa or card.
            </p>

            {/* Image preview grid */}
            <div className="grid grid-cols-3 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-48 mb-6">
              {PREVIEW_IMAGES.map((img, i) => (
                <div key={i} className={`relative ${img.className} overflow-hidden bg-secondary`}>
                  <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="200px" />
                </div>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button asChild>
                <Link href="/digitika">Browse all courses <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Corporate training</Link>
              </Button>
            </div>
          </div>

          {/* Right — course category links */}
          <div className="flex flex-col gap-2">
            {COURSE_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/digitika#${cat.id}`}
                className="group flex items-center justify-between px-6 py-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/3 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ background: cat.color }}
                  />
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{cat.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{cat.tagline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs font-bold" style={{ color: cat.color }}>{cat.courses.length} courses</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
