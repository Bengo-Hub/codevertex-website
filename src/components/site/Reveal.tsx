'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Phase = 'static' | 'waiting' | 'shown';

/**
 * Fades a block up into place the first time it scrolls into view. The server renders it
 * visible (no JavaScript, crawlers and slow devices always see the content); after hydration
 * only blocks still below the fold are hidden and wait for the observer. Reduced-motion users
 * see everything at once (see .reveal in globals.css).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'li' | 'section' | 'figure';
}) {
  const ref = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already in view
    setPhase('waiting');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase('shown');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn(phase !== 'static' && 'reveal', phase === 'shown' && 'is-visible', className)}
      style={delay && phase !== 'static' ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
