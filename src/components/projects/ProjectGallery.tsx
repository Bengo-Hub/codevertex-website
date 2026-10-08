'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface GalleryPhoto { id: string; caption: string | null }

export function ProjectGallery({ photos, title }: { photos: GalleryPhoto[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? null : (i + d + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step]);

  return (
    <>
      <div className="columns-2 md:columns-3 gap-3 [&>*]:mb-3">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(i)}
            className="block w-full overflow-hidden rounded-xl border border-border bg-muted break-inside-avoid focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label={`View photo ${i + 1} of ${photos.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/projects/photos/${p.id}`}
              alt={p.caption ?? `${title} — photo ${i + 1}`}
              loading="lazy"
              className="w-full h-auto transition-transform duration-300 hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo viewer`}
          onClick={close}
        >
          <button onClick={close} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                className="absolute left-3 sm:left-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); step(1); }}
                className="absolute right-3 sm:right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/projects/photos/${photos[open].id}`}
              alt={photos[open].caption ?? `${title} — photo ${open + 1}`}
              className="max-h-[85vh] w-auto mx-auto rounded-lg"
            />
            <figcaption className="text-center text-xs text-white/70 mt-2">
              {photos[open].caption ? `${photos[open].caption} · ` : ''}{open + 1} / {photos.length}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
