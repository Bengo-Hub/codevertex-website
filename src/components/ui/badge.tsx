// React 19.2 — ref as regular prop
import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  ref?: React.Ref<HTMLSpanElement>;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary text-secondary-foreground border-border',
  outline: 'border-border text-foreground',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  destructive: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

function Badge({ className, variant = 'default', ref, ...props }: BadgeProps) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
Badge.displayName = 'Badge';

export { Badge };
