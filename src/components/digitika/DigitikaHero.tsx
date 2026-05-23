'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Award, Users, Globe, ChevronLeft, ChevronRight, GraduationCap, CreditCard, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATS = [
  { icon: Users, value: '200+', label: 'Corporate staff trained' },
  { icon: BookOpen, value: '120+', label: 'Students certified' },
  { icon: Award, value: '24', label: 'Courses across 5 disciplines' },
  { icon: Globe, value: 'Online', label: 'And in-person · Kisumu' },
];

const GALLERY = [
  {
    src: '/images/hub.jpg',
    caption: 'Our Pioneer House computer lab — Lenovo workstations, fibre internet, professional environment',
    alt: 'Codevertex Africa Limited computer lab in Kisumu with Lenovo computers',
  },
  {
    src: '/images/students.jpg',
    caption: 'Active cohorts every intake — small classes, focused learning, real projects',
    alt: 'Digitika Academy students working on laptops in class',
  },
  {
    src: '/images/MUSICA%20HACKATHON/SPK_6501.jpg',
    caption: 'MUCISA Hackathon — Codevertex × Maseno University, building real solutions under pressure',
    alt: 'Student coding at MUCISA Hackathon in Codevertex t-shirt',
  },
  {
    src: '/images/MUSICA%20HACKATHON/SPK_6503.jpg',
    caption: 'Industry mentors guiding students through real challenges — not just theory',
    alt: 'Mentor explaining concept to students at hackathon',
  },
];

const DISCIPLINES = [
  { name: 'Software Engineering', color: '#10B981', courses: 8, icon: '⌨️' },
  { name: 'ICDL Certification', color: '#9100B0', courses: 4, icon: '🖥️' },
  { name: 'Cisco Networking', color: '#0EA5E9', courses: 4, icon: '🌐' },
  { name: 'AI & Machine Learning', color: '#F59E0B', courses: 4, icon: '🤖' },
  { name: 'Data Analytics', color: '#4ade80', courses: 4, icon: '📊' },
];

export function DigitikaHero() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % GALLERY.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative pt-20 pb-0 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-150 h-100 bg-primary/8 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-87.5 h-87.5 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:items-stretch">

          {/* Left: text */}
          <div className="flex flex-col">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Digitika Academy — by Codevertex Africa Limited
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-[1.03] mb-5">
              Closing Africa&apos;s{' '}
              <span className="gradient-text">digital skills gap.</span>
            </h1>

            <p className="text-muted-foreground text-lg font-medium max-w-xl leading-relaxed mb-6">
              Industry-aligned certification programmes in ICT, networking, AI, software engineering
              and data analytics — delivered in Kisumu and online across Africa.
            </p>

            {/* Discipline tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {DISCIPLINES.map(d => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                  style={{ color: d.color, borderColor: `${d.color}30`, background: `${d.color}10` }}
                >
                  <span>{d.icon}</span> {d.name}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-10">
              <Button asChild size="lg">
                <Link href="#software">
                  Browse courses <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/contact">Corporate training</Link>
              </Button>
            </div>

            {/* Spacer: pushes stats to the bottom so it aligns with the enrollment card */}
            <div className="flex-1 hidden lg:block" />

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border border-border">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-card px-5 py-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xl font-black text-foreground tracking-tight">{value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-medium leading-snug">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: image carousel + enrollment card */}
          <div className="flex flex-col gap-4">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl shadow-primary/5 bg-card flex-1 min-h-64 aspect-4/3 lg:aspect-auto">
            {GALLERY.map((item, i) => (
              <div
                key={item.src}
                className={`absolute inset-0 transition-opacity duration-700 ${i === slide ? 'opacity-100' : 'opacity-0'}`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={i === 0}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-sm font-medium text-white drop-shadow">{item.caption}</p>
                </div>
              </div>
            ))}
            {/* Carousel controls */}
            <button
              onClick={() => setSlide(s => (s - 1 + GALLERY.length) % GALLERY.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 backdrop-blur border border-border flex items-center justify-center hover:bg-background transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={() => setSlide(s => (s + 1) % GALLERY.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/60 backdrop-blur border border-border flex items-center justify-center hover:bg-background transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
              {GALLERY.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === slide ? 'bg-white w-4' : 'bg-white/40'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            {/* Digitika logo + badges overlay */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
              {/* Digitika Academy logo on dark surface */}
              <div className="bg-black/70 backdrop-blur rounded-xl px-3 py-1.5 border border-white/10">
                <Image
                  src="/images/logo.png"
                  alt="Digitika Academy — Learn | Innovate | Disrupt"
                  width={110}
                  height={28}
                  className="h-6 w-auto object-contain"
                />
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className="px-3 py-1.5 rounded-full bg-primary/90 text-white text-xs font-bold shadow-lg">ICDL Certified</span>
                <span className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur border border-white/10 text-white text-xs font-bold shadow-lg">Cisco Partner</span>
              </div>
            </div>
          </div>

          {/* My Enrollment card — fills the space below the carousel */}
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: 'hsl(var(--primary))' }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Already enrolled?
              </p>
              <p className="text-sm font-black text-white leading-snug mt-0.5">
                Access your student portal
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                {[
                  { icon: CreditCard, text: 'Payment schedule' },
                  { icon: Bell, text: 'Pay installments' },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    <Icon className="h-3 w-3 shrink-0" />
                    {text}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/digitika/my-enrollment"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition-opacity hover:opacity-90 shrink-0"
              style={{
                background: 'white',
                color: 'hsl(var(--primary))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                whiteSpace: 'nowrap',
              }}
            >
              My Enrollment
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          </div>{/* end right column */}

        </div>
      </div>

      {/* Programme pathway strip */}
      <div className="relative z-10 max-w-7xl mx-auto mt-12 mb-0">
        <div className="flex flex-col sm:flex-row items-stretch border border-border rounded-2xl overflow-hidden bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[
            { step: '01', title: 'Choose a track', desc: 'Software, AI, Data, Networking or ICDL' },
            { step: '02', title: 'Enroll & pay', desc: 'M-Pesa, card or installments accepted' },
            { step: '03', title: 'Learn & build', desc: '3 evenings/week + Saturday labs' },
            { step: '04', title: 'Get certified', desc: 'Industry-recognised certificate & portfolio' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex-1 px-6 py-5">
              <span className="text-xs font-black text-primary tracking-widest uppercase">{step}</span>
              <p className="font-bold text-foreground mt-1 text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
