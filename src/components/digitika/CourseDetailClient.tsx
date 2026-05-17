'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2, Clock, Users, MapPin, Calendar, ChevronDown, ChevronUp,
  Download, ArrowRight, ArrowLeft, Share2, Check, BookOpen, Target,
  Star, Briefcase, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type CourseCategory, ALUMNI_COMPANIES, type WeeklyModule, type Testimonial } from '@/config/courses';
import { type DbCourse } from '@/types/course';
import { formatCurrency } from '@/lib/utils';
import { EnrollmentModal } from './EnrollmentModal';
import { cn } from '@/lib/utils';

// Static supplemental data that's not stored in DB
interface StaticData {
  curriculum?: WeeklyModule[];
  testimonials?: Testimonial[];
  alumniCompanies?: { name: string; logo: string }[];
  brochure?: string;
  location?: string;
  cohortSize?: number;
  startDate?: string;
}

interface Props {
  course: DbCourse;
  category: CourseCategory;
  staticData?: StaticData;
}

export function CourseDetailClient({ course, category, staticData = {} }: Props) {
  const plans = course.installmentsEnabled ? course.installmentPlans : [];
  const defaultPlanIdx = plans.findIndex(p => p.badge) >= 0 ? plans.findIndex(p => p.badge) : 0;

  const [showCurriculum, setShowCurriculum] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(defaultPlanIdx);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: course.name, text: course.description, url });
      } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasCurriculum = staticData.curriculum && staticData.curriculum.length > 0;
  const hasInstallments = plans.length > 0;
  const hasTestimonials = staticData.testimonials && staticData.testimonials.length > 0;
  const hasAlumni = staticData.alumniCompanies && staticData.alumniCompanies.length > 0;

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-background/80 backdrop-blur sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm">
          <Link href="/digitika" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Digitika Academy
          </Link>
          <span className="text-border">/</span>
          <span className="font-medium text-foreground truncate">{course.shortName ?? course.name}</span>
        </div>
      </div>

      {/* Hero band */}
      <div className="py-12 px-4 sm:px-6 lg:px-8" style={{ background: `linear-gradient(135deg, ${category.color}12, ${category.color}06)` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                style={{ background: `${category.color}18`, color: category.color }}
              >
                {category.name}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight mb-3">
                {course.name}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                {course.longDescription ?? course.description}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>

          {/* Meta strip */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Clock, label: course.duration },
              { icon: BookOpen, label: course.mode },
              ...(staticData.cohortSize ? [{ icon: Users, label: `${staticData.cohortSize} slots per cohort` }] : []),
              ...(staticData.location ? [{ icon: MapPin, label: staticData.location }] : []),
              ...(staticData.startDate ? [{ icon: Calendar, label: `Next: ${staticData.startDate}` }] : []),
              ...(course.audience ? [{ icon: GraduationCap, label: course.audience }] : []),
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border text-sm text-muted-foreground">
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: category.color }} />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: Course content */}
          <div className="lg:col-span-2 space-y-10">

            {/* Outcomes */}
            <section>
              <h2 className="text-xl font-black text-foreground mb-5 flex items-center gap-2">
                <Target className="h-5 w-5" style={{ color: category.color }} /> What you&apos;ll achieve
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.outcomes.map(o => (
                  <div key={o} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: category.color }} />
                    <span className="text-sm text-foreground">{o}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Includes */}
            {course.includes.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-foreground mb-5">Everything included</h2>
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="h-1" style={{ background: category.color }} />
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.includes.map(item => (
                      <div key={item} className="flex items-start gap-2.5 text-sm">
                        <span className="font-bold mt-0.5" style={{ color: category.color }}>✓</span>
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Curriculum */}
            {hasCurriculum && (
              <section>
                <button
                  onClick={() => setShowCurriculum(!showCurriculum)}
                  className="w-full flex items-center justify-between text-xl font-black text-foreground mb-2 hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" style={{ color: category.color }} />
                    {staticData.curriculum!.length}-Week Curriculum
                  </span>
                  {showCurriculum ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                <p className="text-sm text-muted-foreground mb-4">Click to {showCurriculum ? 'hide' : 'expand'} the full week-by-week breakdown</p>

                {showCurriculum && (
                  <div className="space-y-3">
                    {staticData.curriculum!.map(mod => (
                      <div key={mod.week} className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-black bg-primary text-primary-foreground">
                          W{mod.week}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm mb-2">{mod.title}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {mod.topics.map(t => (
                              <span key={t} className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-secondary border border-border">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Stack */}
            {course.stack && (
              <section>
                <h2 className="text-xl font-black text-foreground mb-4">Tech Stack</h2>
                <div className="p-4 rounded-xl bg-secondary border border-border text-sm text-muted-foreground">
                  <strong className="text-foreground">Tools & technologies: </strong>{course.stack}
                </div>
              </section>
            )}

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-foreground mb-4">Prerequisites</h2>
                <div className="space-y-2">
                  {course.prerequisites.map(p => (
                    <div key={p} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: category.color }} />
                      {p}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Career paths */}
            {course.careerPaths.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" style={{ color: category.color }} /> Career Pathways
                </h2>
                <div className="flex flex-wrap gap-2">
                  {course.careerPaths.map(path => (
                    <span
                      key={path}
                      className="px-3 py-1.5 rounded-full text-sm font-medium border border-primary/30 bg-primary/5 text-primary"
                    >
                      {path}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Alumni companies */}
            {hasAlumni && (
              <section>
                <h2 className="text-xl font-black text-foreground mb-2">Our graduates work at</h2>
                <p className="text-sm text-muted-foreground mb-6">Companies that have hired Digitika Academy graduates</p>
                <div className="flex flex-wrap items-center gap-8">
                  {(staticData.alumniCompanies ?? ALUMNI_COMPANIES).map(co => (
                    <div key={co.name} className="grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300" title={co.name}>
                      <Image src={co.logo} alt={co.name} width={100} height={32} className="h-7 w-auto object-contain" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Testimonials */}
            {hasTestimonials && (
              <section>
                <h2 className="text-xl font-black text-foreground mb-6">What graduates say</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {staticData.testimonials!.map(t => (
                    <div key={t.name} className="p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors">
                      <Star className="h-4 w-4 mb-3" style={{ color: category.color }} />
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-primary-foreground bg-primary text-xs font-black shrink-0">
                          {t.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{t.name}</p>
                          <p className="text-[11px] text-muted-foreground">{t.role} · {t.company}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right: Pricing card (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl shadow-black/5">
                <div className="h-1.5" style={{ background: category.color }} />
                <div className="p-6">

                  {hasInstallments ? (
                    <>
                      <h3 className="font-bold text-foreground text-base mb-4">Choose a payment plan</h3>
                      <div className="space-y-3 mb-6">
                        {plans.map((plan, idx) => (
                          <button
                            key={plan.label}
                            onClick={() => setSelectedPlan(idx)}
                            className={cn(
                              'w-full text-left p-4 rounded-xl border-2 transition-all',
                              selectedPlan === idx ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center', selectedPlan === idx ? 'border-primary' : 'border-border')}>
                                  {selectedPlan === idx && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <span className="text-sm font-bold text-foreground">{plan.label}</span>
                              </div>
                              {plan.badge && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary text-primary-foreground">{plan.badge}</span>
                              )}
                            </div>
                            <div className="ml-6 space-y-1">
                              {plan.payments.map(p => (
                                <div key={p.label} className="flex justify-between text-xs text-muted-foreground">
                                  <span>{p.label}</span>
                                  <span className="font-semibold text-foreground">{formatCurrency(p.amount, 'KES')}</span>
                                </div>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between items-baseline mb-5 px-1">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-2xl font-black text-foreground">
                          {formatCurrency(plans[selectedPlan]?.totalAmount ?? course.price, 'KES')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="mb-6">
                      <p className="text-xs text-muted-foreground mb-1">Course fee</p>
                      <div className="text-3xl font-black text-foreground mb-1">{formatCurrency(course.price, 'KES')}</div>
                      <p className="text-xs text-muted-foreground">one-time · M-Pesa & card accepted</p>
                    </div>
                  )}

                  <Button
                    onClick={() => setEnrollOpen(true)}
                    className="w-full"
                    size="lg"
                  >
                    Apply Now <ArrowRight className="h-4 w-4" />
                  </Button>

                  {staticData.brochure && (
                    <Link
                      href={staticData.brochure}
                      target="_blank"
                      className="flex items-center justify-center gap-2 mt-3 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Course Brochure
                    </Link>
                  )}

                  <p className="text-[11px] text-center text-muted-foreground mt-4 leading-relaxed">
                    Questions?{' '}
                    <a href="https://wa.me/254743793901" className="font-semibold text-primary hover:underline">
                      WhatsApp us
                    </a>
                    {' '}or call{' '}
                    <a href="tel:+254743793901" className="font-semibold text-primary hover:underline">
                      +254 743 793 901
                    </a>
                  </p>
                </div>
              </div>

              {/* Share card */}
              <div className="mt-4 p-4 rounded-xl bg-secondary border border-border">
                <p className="text-xs font-bold text-foreground mb-2">Share this course</p>
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out this course: ${course.name} at Digitika Academy — https://codevertexitsolutions.com/digitika/${course.id}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center px-3 py-2 rounded-lg bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    WhatsApp
                  </a>
                  <button
                    onClick={handleShare}
                    className="flex-1 text-center px-3 py-2 rounded-lg bg-background border border-border text-xs font-bold text-foreground hover:border-primary/30 transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy link'}
                  </button>
                </div>
              </div>

              {/* Back to all courses */}
              <Link
                href="/digitika"
                className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> All courses
              </Link>
            </div>
          </div>
        </div>
      </div>

      {enrollOpen && (
        <EnrollmentModal
          course={course}
          category={category}
          onClose={() => setEnrollOpen(false)}
        />
      )}
    </div>
  );
}
