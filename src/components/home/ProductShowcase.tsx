'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ShowcaseProduct {
  id: string;
  name: string;
  summary: string;
  description: string;
  highlights: string[];
  url: string;
  price: string | null;
  screenshot: { src: string; alt: string; credit?: string };
}

/**
 * The core products with their real screens. Picking a product on the left swaps the screen and
 * the details; on phones the list scrolls sideways above the screen. Icons cannot cross the
 * server/client boundary, so the list is plain text.
 */
export function ProductShowcase({ products }: { products: ShowcaseProduct[] }) {
  const [active, setActive] = useState(0);
  const p = products[active];
  if (!p) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
      <div role="tablist" aria-label="Products" className="lg:col-span-4 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 [scrollbar-width:none]">
        {products.map((item, i) => (
          <button
            key={item.id}
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={i === active}
            aria-controls="showcase-panel"
            onClick={() => setActive(i)}
            className={cn(
              'shrink-0 rounded-2xl px-4 py-3 text-left transition-colors',
              i === active ? 'glass ring-1 ring-primary/30' : 'hover:bg-white/60 dark:hover:bg-white/5',
            )}
          >
            <span className={cn('block font-semibold whitespace-nowrap lg:whitespace-normal', i === active ? 'text-primary' : 'text-foreground')}>{item.name}</span>
            <span className="hidden lg:block text-sm text-muted-foreground mt-0.5">{item.summary}</span>
          </button>
        ))}
      </div>

      <div id="showcase-panel" role="tabpanel" aria-labelledby={`tab-${p.id}`} className="lg:col-span-8">
        <div className="glass rounded-4xl p-2 shadow-lift">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-night">
            <Image key={p.id} src={p.screenshot.src} alt={p.screenshot.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover animate-fade-in" />
            <a href={p.url} target="_blank" rel="noreferrer" className="glass absolute left-3 bottom-3 rounded-full px-3 py-1 text-xs font-medium text-foreground hover:bg-white">
              {p.url.replace('https://', '')}
            </a>
          </div>
        </div>
        {p.screenshot.credit && <p className="mt-2 text-xs text-muted-foreground">{p.screenshot.credit}</p>}

        <div className="mt-6 grid gap-6 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <h3 className="font-display text-2xl font-bold text-foreground">{p.name}</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">{p.description}</p>
          </div>
          <div className="sm:col-span-2">
            <ul className="space-y-2">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-foreground/85">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden /> {h}
                </li>
              ))}
            </ul>
            {p.price && <p className="mt-3 text-sm font-semibold text-foreground">{p.price}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full" asChild><Link href={`/contact?service=${p.id}`}>Ask for a demo</Link></Button>
              <Button size="sm" variant="ghost" className="rounded-full" asChild><Link href={`/services#${p.id}`}>Details</Link></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
