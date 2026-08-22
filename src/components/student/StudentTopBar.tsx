'use client';

import { GraduationCap, Menu } from 'lucide-react';

export function StudentTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
      <button
        onClick={onOpenMenu}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground hover:bg-secondary"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold text-foreground">Student Portal</span>
      </div>
    </header>
  );
}
