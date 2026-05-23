import Image from 'next/image';
import { Quote, ExternalLink } from 'lucide-react';

const GALLERY_ITEMS = [
  {
    src: '/images/MUSICA%20HACKATHON/SPK_6504.jpg',
    alt: 'Instructor presenting at MUCISA Hackathon, Maseno University',
    caption: 'MUCISA Hackathon — co-hosted with Maseno University under the Digitika programme',
    span: 'col-span-2',
  },
  {
    src: '/images/MUSICA%20HACKATHON/SPK_6501.jpg',
    alt: 'Student coding at MUCISA Hackathon in Codevertex t-shirt',
    caption: 'Hands-on, every session',
    span: 'col-span-1',
  },
  {
    src: '/images/MUSICA%20HACKATHON/SPK_6502.jpg',
    alt: 'Students collaborating with a mentor at the hackathon',
    caption: 'Industry mentors on every project',
    span: 'col-span-1',
  },
];

const HIGHLIGHTS = [
  { stat: '3×', label: 'Evenings per week, in-person or online' },
  { stat: '4–8', label: 'Weeks to a recognised certificate' },
  { stat: '100%', label: 'Hands-on project-based curriculum' },
  { stat: 'KES', label: 'M-Pesa, card, or installment plans' },
];

export function LifeAtDigitika() {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Life at Digitika</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight max-w-2xl">
            More than a course — a launchpad.
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
            Small cohorts, expert mentors, and a community of peers building Africa&apos;s next generation of tech talent.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Gallery grid */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {GALLERY_ITEMS.map(item => (
              <div
                key={item.src}
                className={`relative rounded-2xl overflow-hidden bg-secondary ${item.span} aspect-video`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-background/70 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 right-3 text-xs font-semibold text-white/90">{item.caption}</p>
              </div>
            ))}
          </div>

          {/* Right: highlights + quote */}
          <div className="flex flex-col gap-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {HIGHLIGHTS.map(h => (
                <div key={h.stat} className="p-4 rounded-xl bg-card border border-border">
                  <div className="text-2xl font-black text-primary">{h.stat}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{h.label}</p>
                </div>
              ))}
            </div>

            {/* Pull quote */}
            <div className="flex-1 p-6 rounded-2xl bg-card border border-border flex flex-col justify-between">
              <Quote className="h-8 w-8 text-primary/30 mb-3" />
              <blockquote className="text-sm text-foreground font-medium leading-relaxed flex-1">
                &ldquo;I enrolled in Code-Starter with zero programming experience. Eight weeks later,
                I had a full portfolio and a junior developer role lined up. The instructors
                don&apos;t just teach — they build with you.&rdquo;
              </blockquote>
              <div className="mt-4 flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-black text-sm">A</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Aisha K.</p>
                  <p className="text-xs text-muted-foreground">Code-Starter Graduate · Now at Safaricom PLC</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MUSICA Hackathon callout */}
        <div className="mb-8 rounded-2xl overflow-hidden border border-border bg-card">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Photos strip */}
            <div className="grid grid-cols-3 h-52">
              {[
                { src: '/images/MUSICA%20HACKATHON/SPK_6501.jpg', alt: 'Student hacking at MUCISA' },
                { src: '/images/MUSICA%20HACKATHON/SPK_6503.jpg', alt: 'Mentor guiding students' },
                { src: '/images/MUSICA%20HACKATHON/SPK_6506.jpg', alt: 'Students networking' },
              ].map(img => (
                <div key={img.src} className="relative overflow-hidden">
                  <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="200px" />
                </div>
              ))}
            </div>
            {/* Text */}
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Digitika Academy"
                  width={160}
                  height={44}
                  className="h-9 w-auto object-contain bg-black rounded px-1"
                />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">× Maseno University</span>
              </div>
              <h3 className="text-xl font-black text-foreground mb-3">MUCISA Hackathon</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Codevertex co-hosted the MUCISA Hackathon with Maseno University Computer &amp; IT Students&apos; Association —
                bringing together 120+ students to build real solutions to real problems, mentored by Digitika&apos;s industry practitioners.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <ExternalLink className="h-3.5 w-3.5" />
                A Digitika Academy flagship event · Kisumu, Kenya
              </div>
            </div>
          </div>
        </div>

        {/* Enrolment info strip */}
        <div className="flex flex-col sm:flex-row items-stretch gap-0 rounded-2xl overflow-hidden border border-border">
          {[
            { label: 'Next intake', value: 'June 2026', sub: 'Applications open now' },
            { label: 'Location', value: 'Kisumu + Online', sub: 'Pioneer House, Oginga St' },
            { label: 'Payment', value: 'M-Pesa / Card', sub: 'Paybill 542542 · Acc 87660' },
            { label: 'Duration', value: '4–16 weeks', sub: 'Depending on programme' },
          ].map(item => (
            <div key={item.label} className="flex-1 px-6 py-5 bg-card border-r border-border last:border-r-0">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">{item.label}</p>
              <p className="font-black text-foreground text-base">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
