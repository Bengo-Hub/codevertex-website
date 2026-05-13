import Link from 'next/link';
import Image from 'next/image';
import { CircleCheck as CheckCircle, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TRACKS = [
  {
    id: 'software',
    title: 'Software Engineering',
    badge: 'Most Popular',
    badgeColor: '#10B981',
    duration: '4 months',
    price: 'KES 30,000',
    cover: '/images/illustrations/course-software.svg',
    outcomes: ['Full-stack web apps', 'React & Node.js', 'Real project portfolio', 'Code-Starter certification'],
    href: '/digitika/code-starter',
  },
  {
    id: 'icdl',
    title: 'ICDL Certification',
    badge: 'Internationally Recognised',
    badgeColor: '#38bdf8',
    duration: '6 weeks',
    price: 'KES 15,000',
    cover: '/images/ICDL-core-course.png',
    outcomes: ['Computer fundamentals', 'Microsoft Office Suite', 'Online collaboration', 'ICDL Core certificate'],
    href: '/digitika/icdl-core',
  },
  {
    id: 'ccna',
    title: 'Cisco Networking (CCNA)',
    badge: 'Industry Standard',
    badgeColor: '#f59e0b',
    duration: '3 months',
    price: 'KES 25,000',
    cover: '/images/Cisco.png',
    outcomes: ['Network design & config', 'Routing & switching', 'Network security basics', 'CCNA exam prep'],
    href: '/digitika/ccna-1',
  },
  {
    id: 'ai',
    title: 'AI & Data Analytics',
    badge: 'Future-Ready',
    badgeColor: '#F59E0B',
    duration: '8 weeks',
    price: 'KES 20,000',
    cover: '/images/illustrations/course-ai.svg',
    outcomes: ['Python for data science', 'Machine learning basics', 'Data visualisation', 'AI tools & prompting'],
    href: '/digitika/ai-fundamentals',
  },
];

export function ProgrammeHighlights() {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Choose your path</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Four tracks. Real certification.
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Each programme is designed with industry partners and leads to a recognised certificate.
              Learn evenings and weekends — no need to quit your job.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">3 evenings/week + Saturday labs</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {TRACKS.map(track => (
            <Link
              key={track.id}
              href={track.href}
              className="group flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
            >
              {/* Cover */}
              <div className="relative h-36 overflow-hidden bg-secondary/50">
                <Image
                  src={track.cover}
                  alt={track.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-400"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-card/60 to-transparent" />
                <span
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                  style={{ background: track.badgeColor }}
                >
                  {track.badge}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-foreground text-base leading-snug mb-3 group-hover:text-primary transition-colors">
                  {track.title}
                </h3>
                <ul className="space-y-1.5 flex-1 mb-4">
                  {track.outcomes.map(o => (
                    <li key={o} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      {o}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <div className="font-black text-foreground">{track.price}</div>
                    <div className="text-xs text-muted-foreground">{track.duration}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-primary">Certified</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border">
          <div>
            <p className="font-bold text-foreground">Need corporate training for your team?</p>
            <p className="text-sm text-muted-foreground mt-0.5">We deliver tailored programmes on-site or online for organisations of any size.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/contact">Get a custom quote</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
