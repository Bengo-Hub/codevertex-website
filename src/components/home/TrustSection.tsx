import Image from 'next/image';

const CLIENTS = [
  { name: 'Maseno University (MUCISA)', detail: '120+ students upskilled in coding & digital entrepreneurship' },
  { name: 'Digital Economy ICT Initiative', detail: '200+ corporate staff trained under national programme' },
  { name: 'Danka Africa Ltd', detail: 'End-to-end digital transformation, regional energy sector' },
  { name: 'KCA University', detail: 'Long-term strategic technology & training partnership' },
  { name: 'Future Hubs Kenya', detail: 'Collaborative training delivery and technology development' },
];

const ADVANTAGES = [
  { title: 'End-to-End Value Chain', desc: 'Software engineering, AI, cloud infrastructure, hosting, domains, and talent development — one true partner from MVP to scale.' },
  { title: 'Security & Compliance', desc: 'OAuth 2.0, OpenID Connect, AES-256 encryption, and secure-by-design principles at every layer of the stack.' },
  { title: 'Modular Scalability', desc: 'SSO-centric architecture enables rapid onboarding of new SaaS modules without disrupting existing client workflows.' },
  { title: 'AI-Native Orientation', desc: "Deep investment in generative AI and analytics positions clients for the intelligent economy — not just today's requirements." },
];

export function TrustSection() {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Team photo + pull quote */}
        <div className="relative rounded-2xl overflow-hidden h-80 border border-border">
          <Image
            src="/images/team.jpg"
            alt="Codevertex IT Solutions team at an event, wearing company t-shirts"
            fill
            className="object-cover object-[center_50%]"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/60 to-black/20" />
          <div className="absolute inset-0 flex items-center px-10">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">The team</p>
              <blockquote className="text-3xl sm:text-4xl font-black text-white leading-snug tracking-tight mb-4">
                &ldquo;Built in Kisumu. Engineered for Africa. Designed for the world.&rdquo;
              </blockquote>
              <cite className="not-italic text-sm text-white/60 font-medium">
                Codevertex IT Solutions — Pioneer House, Oginga Street, Kisumu
              </cite>
            </div>
          </div>
        </div>

        {/* Clients + Advantages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Institutional partners</p>
            <div className="flex flex-col gap-3">
              {CLIENTS.map((c) => (
                <div key={c.name} className="flex gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors">
                  <div className="w-1 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="font-bold text-foreground text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Our edge</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ADVANTAGES.map((a) => (
                <div key={a.title} className="p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors">
                  <p className="font-bold text-foreground text-sm mb-2">{a.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Facility photo strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative rounded-2xl overflow-hidden h-48 md:col-span-2 border border-border">
            <Image
              src="/images/hub.jpg"
              alt="Codevertex Pioneer House computer lab — Lenovo workstations and fibre internet"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 66vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-sm font-bold text-white drop-shadow">Pioneer House, Kisumu</p>
              <p className="text-xs text-white/80 drop-shadow">Our flagship training lab — fully equipped with Lenovo workstations</p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden h-48 border border-border">
            <Image
              src="/images/MUSICA%20HACKATHON/SPK_6506.jpg"
              alt="Students at MUCISA Hackathon"
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-sm font-bold text-white drop-shadow">MUCISA Hackathon</p>
              <p className="text-xs text-white/80 drop-shadow">Co-hosted with Maseno University</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
