'use client';

// Sign-in entry point used by the admin layout (and any protected page) when a visitor is
// not authenticated: /auth/login?returnTo=/admin
//
// This route previously did not exist, so the redirect from /admin ended on a 404 and the
// public "Admin Login" button was the only way in. Now staff can simply open /admin.
import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

// Only allow same-site paths, so this can never be used as an open redirect.
function safeReturnTo(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/auth/')) return '/admin';
  return raw;
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user, login, ready } = useAuthStore();
  const started = useRef(false);
  const returnTo = safeReturnTo(searchParams.get('returnTo'));

  useEffect(() => {
    if (!ready || status === 'loading') return; // session is being restored; wait
    if (status === 'authenticated' && user) {
      router.replace(returnTo);
      return;
    }
    if (status === 'error') return; // show the message below instead of retrying in a loop
    if (started.current) return;
    started.current = true;
    void login(returnTo, returnTo.startsWith('/student') ? 'student' : 'admin');
  }, [ready, status, user, returnTo, login, router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-black text-foreground mb-2">Sign-in failed</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We could not start the sign-in. Please try again.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                started.current = true;
                void login(returnTo, returnTo.startsWith('/student') ? 'student' : 'admin');
              }}
              className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-bold"
            >
              Try again
            </button>
            <Link href="/" className="text-sm font-semibold text-primary hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
