import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldOff } from 'lucide-react';

export const metadata: Metadata = { title: 'Unauthorized' };

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-sm px-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <ShieldOff className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-sm mb-6">
          You do not have permission to access the admin area. Please sign in with an admin account.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
