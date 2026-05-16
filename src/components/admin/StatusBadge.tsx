const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  succeeded: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  paid:      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  failed:    'bg-red-500/10 text-red-600 dark:text-red-400',
  overdue:   'bg-red-500/10 text-red-600 dark:text-red-400',
  refunded:  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  new:       'bg-primary/10 text-primary',
  contacted: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  qualified: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  converted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  lost:      'bg-muted text-muted-foreground',
  open:      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  full:      'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  closed:    'bg-muted text-muted-foreground',
  completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  reminded:  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}
