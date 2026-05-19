import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-foreground border border-border/20 overflow-hidden">
          {/* Glow accents */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: text + CTAs */}
            <div className="p-10 sm:p-14 flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Get Started</p>
              <h2 className="text-4xl sm:text-5xl font-black text-white dark:text-foreground tracking-tight leading-tight mb-5">
                Ready to build your<br />
                <span className="text-primary">digital infrastructure?</span>
              </h2>
              <p className="text-white/65 dark:text-muted-foreground text-base font-medium max-w-md mb-8 leading-relaxed">
                Join hundreds of businesses across Africa transforming their operations with the Codevertex ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link href="/contact">
                    Book a free demo <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 dark:border-foreground/20 text-white dark:text-foreground bg-transparent hover:bg-white/10 dark:hover:bg-foreground/10 hover:border-white/30 dark:hover:border-foreground/30"
                  asChild
                >
                  <a href="tel:+254743793901">
                    <Phone className="h-4 w-4" /> Call us now
                  </a>
                </Button>
              </div>
              <p className="text-white/40 dark:text-muted-foreground text-xs mt-5 font-medium">
                +254 743 793 901 · Pioneer House, Oginga Street, Kisumu
              </p>
            </div>

            {/* Right: photo collage */}
            <div className="relative hidden lg:grid grid-cols-2 gap-2 p-4 min-h-80">
              <div className="relative rounded-xl overflow-hidden">
                <Image
                  src="/images/hub.jpg"
                  alt="Codevertex Pioneer House computer lab"
                  fill
                  className="object-cover"
                  sizes="300px"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                <p className="absolute bottom-3 left-3 text-white text-xs font-bold">Pioneer House Lab</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="relative rounded-xl overflow-hidden flex-1">
                  <Image
                    src="/images/team.jpg"
                    alt="Codevertex team"
                    fill
                    className="object-cover object-top"
                    sizes="150px"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-white text-xs font-bold">The Team</p>
                </div>
                <div className="relative rounded-xl overflow-hidden flex-1">
                  <Image
                    src="/images/MUSICA%20HACKATHON/SPK_6506.jpg"
                    alt="MUCISA Hackathon"
                    fill
                    className="object-cover object-top"
                    sizes="150px"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-white text-xs font-bold">MUCISA Hackathon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
