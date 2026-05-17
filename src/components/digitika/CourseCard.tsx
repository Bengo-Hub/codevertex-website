import Link from 'next/link';
import Image from 'next/image';
import { Clock, Monitor, ArrowRight } from 'lucide-react';
import { type CourseCategory, COURSE_COVER_IMAGES } from '@/config/courses';
import { type DbCourse } from '@/types/course';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface Props {
  course: DbCourse;
  category: CourseCategory;
}

export function CourseCard({ course, category }: Props) {
  const cover = course.coverImage ?? COURSE_COVER_IMAGES[course.id];

  return (
    <Link
      href={`/digitika/${course.id}`}
      className="group flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
    >
      {/* Category colour accent strip — only decorative, thin */}
      <div className="h-1 w-full shrink-0" style={{ background: category.color }} />

      {/* Cover image */}
      {cover && (
        <div className="relative h-44 w-full overflow-hidden bg-muted">
          <Image
            src={cover}
            alt={course.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="p-6 flex-1">
        {/* Tags */}
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20 bg-primary/8 text-primary">
            <Monitor className="h-2.5 w-2.5" /> {course.mode}
          </span>
          {course.audience && <Badge variant="secondary">{course.audience}</Badge>}
          {course.featured && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              ★ Featured
            </span>
          )}
        </div>

        <h3 className="font-bold text-foreground text-base leading-snug mb-2 group-hover:text-primary transition-colors">
          {course.name}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Clock className="h-3 w-3" /> {course.duration}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">{course.description}</p>

        {course.stack && (
          <div className="px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-muted-foreground mb-4">
            <strong className="text-primary">Stack: </strong>
            <span className="line-clamp-1">{course.stack}</span>
          </div>
        )}

        {/* Outcomes preview */}
        <div className="flex flex-wrap gap-1.5">
          {course.outcomes.slice(0, 3).map((o) => (
            <span key={o} className="px-2 py-0.5 rounded-full bg-secondary border border-border text-[10px] text-muted-foreground">
              {o}
            </span>
          ))}
          {course.outcomes.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-secondary border border-border text-[10px] text-muted-foreground">
              +{course.outcomes.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4">
        <div>
          <div className="text-xl font-black text-foreground">{formatCurrency(course.price, course.currency)}</div>
          {course.installmentsEnabled && course.installmentPlans.length > 1 ? (
            <div className="text-xs text-muted-foreground">
              from {formatCurrency(course.installmentPlans[1]?.payments[0]?.amount ?? course.price, course.currency)}/installment
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">one-time</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground shrink-0 group-hover:bg-primary/90 transition-colors">
          View course <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
