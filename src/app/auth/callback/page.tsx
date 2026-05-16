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
  const { handleCallback, status, user } = useAuthStore();
  const hasStarted = useRef(false);

  // Effect 1: exchange the code for tokens (runs once)
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error || !code) {
      router.replace('/');
      return;
    }

    if (hasStarted.current) return;
    hasStarted.current = true;

    const storedState = consumeState();
    if (storedState && storedState !== state) {
      // Stale or replayed callback — drop it, let the user re-authenticate
      router.replace('/');
      return;
    }

    const callbackUrl = `${window.location.origin}/auth/callback`;
    handleCallback(code, callbackUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect 2: navigate once auth is confirmed (same pattern as cafe-website)
  useEffect(() => {
    if (status !== 'authenticated') return;

    const returnTo = sessionStorage.getItem('sso_return_to');
    sessionStorage.removeItem('sso_return_to');
    sessionStorage.removeItem('sso_nav_started');

    // Navigate to the return destination, or the role-appropriate default
    const isValidReturn = returnTo && returnTo.startsWith('/') && returnTo !== '/auth/login';
    router.replace(isValidReturn ? returnTo : '/');
  }, [status, user, router]);

  return <Spinner />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackInner />
    </Suspense>
  );
}
