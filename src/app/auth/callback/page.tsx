'use client';
import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { consumeState } from '@/lib/auth/pkce';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);
  const handleCallback = useAuthStore((s) => s.handleCallback);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error || !code) {
      router.replace('/');
      return;
    }

    const storedState = consumeState();
    if (storedState && storedState !== state) {
      router.replace('/');
      return;
    }

    const callbackUrl = `${window.location.origin}/auth/callback`;
    handleCallback(code, callbackUrl).then(async () => {
      // Establish the server-side session cookie the middleware uses for /admin routing
      const { useAuthStore: store } = await import('@/lib/store/auth-store');
      const token = store.getState().accessToken;
      if (token) {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: token }),
        }).catch(() => { /* non-fatal — user will be re-prompted */ });
      }

      const returnTo = sessionStorage.getItem('sso_return_to') || '/';
      sessionStorage.removeItem('sso_return_to');
      router.replace(returnTo);
    });
  }, [searchParams, router, handleCallback]);

  return <Spinner />;
}

// useSearchParams() must be inside a <Suspense> boundary in Next.js 15+.
// Without it the page throws during static rendering and breaks the build.
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackInner />
    </Suspense>
  );
}
