export function AdminFooter() {
  return (
    <footer className="shrink-0 border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
      <span>© {new Date().getFullYear()} Codevertex IT Solutions</span>
      <span>Admin Panel</span>
    </footer>
  );
}
