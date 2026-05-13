import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Careers', description: 'Join Codevertex IT Solutions and build Africa\'s digital future.' };

const JOBS = [
  { title: 'Senior Full-Stack Engineer', team: 'Engineering', location: 'Kisumu / Remote', type: 'Full-time', desc: 'Build and maintain scalable SaaS platforms. React, Node.js, PostgreSQL, Docker.' },
  { title: 'AI/ML Engineer', team: 'AI & Analytics', location: 'Kisumu / Remote', type: 'Full-time', desc: 'Design and deploy machine learning models, NLP pipelines, and AI-powered features across our product suite.' },
  { title: 'Digitika Trainer — Software Engineering', team: 'Academy', location: 'Kisumu', type: 'Part-time / Contract', desc: 'Deliver industry-aligned coding bootcamps for adults and youth. Strong mentoring skills required.' },
  { title: 'DevOps & Cloud Engineer', team: 'Infrastructure', location: 'Remote', type: 'Full-time', desc: 'Kubernetes, CI/CD, GCP/AWS. Manage our multi-tenant cloud infrastructure.' },
  { title: 'Business Development Executive', team: 'Sales', location: 'Kisumu', type: 'Full-time', desc: 'Identify and close enterprise clients for our Power Suite products. B2B SaaS sales experience preferred.' },
  { title: 'UX/UI Designer', team: 'Design', location: 'Remote / Kisumu', type: 'Full-time', desc: 'Own end-to-end product design across our SaaS suite. Figma, design systems, and prototyping.' },
];

export default function CareersPage() {
  return (
    <div className="pt-16">
      <section className="bg-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Careers</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white dark:text-foreground tracking-tight leading-[1.05] mb-4">
            Build Africa&apos;s digital future.
          </h1>
          <p className="text-white/70 dark:text-muted-foreground text-lg max-w-xl leading-relaxed">
            Join a purpose-driven team building the infrastructure for Africa&apos;s digital economy.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-foreground">Open positions</h2>
            <span className="text-xs font-mono text-muted-foreground">{JOBS.length} roles</span>
          </div>
          <div className="flex flex-col gap-3">
            {JOBS.map(job => (
              <div
                key={job.title}
                className="group flex items-center justify-between gap-6 p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{job.team}</span>
                    <span className="text-xs text-muted-foreground">{job.location} · {job.type}</span>
                  </div>
                  <h3 className="font-black text-foreground text-base group-hover:text-primary transition-colors mb-1">{job.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{job.desc}</p>
                </div>
                <Button size="sm" variant="outline" asChild className="shrink-0">
                  <Link href="/contact">Apply <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between p-6 rounded-2xl bg-card border border-border">
            <div>
              <p className="font-bold text-foreground mb-1">Don't see your role?</p>
              <p className="text-sm text-muted-foreground">Send us your CV and a short note about what you'd like to build.</p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <a href="mailto:careers@codevertexitsolutions.com">Open application →</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
