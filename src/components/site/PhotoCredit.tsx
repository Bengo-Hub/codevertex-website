'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Photo credit behind a small info button in the image's top-right corner, so licence credits
 * stay on the page without covering the picture. Opens on hover, keyboard focus or tap; a tap
 * inside a card link opens the credit instead of following the link.
 */
export function PhotoCredit({ credit, className }: { credit: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    // Spans the image's width so the tooltip can never be wider than the photo it describes.
    <span className={cn('group/credit pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-end', className)}>
      <span
        role="button"
        onMouseLeave={() => setOpen(false)}
        tabIndex={0}
        aria-label="Photo credit"
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }
          if (e.key === 'Escape') setOpen(false);
        }}
        onBlur={() => setOpen(false)}
        className="glass pointer-events-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-foreground/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Info className="h-4 w-4" aria-hidden />
      </span>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute right-0 top-full mt-2 w-64 max-w-full rounded-xl bg-night/90 px-3 py-2 text-left text-xs leading-snug text-white shadow-lift transition-opacity duration-200',
          'opacity-0 group-hover/credit:opacity-100',
          open && 'opacity-100',
        )}
      >
        {credit}
      </span>
    </span>
  );
}
