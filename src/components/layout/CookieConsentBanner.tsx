'use client';

import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';

const CONSENT_COOKIE = 'cv_cookie_consent';

function readConsentCookie(): 'accepted' | 'declined' | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return value === 'accepted' || value === 'declined' ? value : null;
}

function writeConsentCookie(value: 'accepted' | 'declined') {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsentCookie() === null);
  }, []);

  function handleChoice(choice: 'accepted' | 'declined') {
    writeConsentCookie(choice);
    setVisible(false);
    window.dispatchEvent(new CustomEvent('cv:cookie-consent', { detail: choice }));
  }

  // Lets the footer "Cookie settings" link re-open the banner at any time.
  useEffect(() => {
    function reopen() {
      setVisible(true);
    }
    window.addEventListener('cv:open-cookie-settings', reopen);
    return () => window.removeEventListener('cv:open-cookie-settings', reopen);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Cookie className="h-4.5 w-4.5 text-primary" />
          </div>
          <p className="text-sm text-foreground">
            We use strictly necessary cookies to run this site, and optional analytics cookies to understand
            how it&apos;s used. See our{' '}
            <a href="/privacy-policy" className="underline underline-offset-2 hover:text-primary">
              Privacy Policy
            </a>{' '}
            for details.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleChoice('declined')}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-foreground border border-border hover:bg-muted transition-colors"
          >
            Decline optional
          </button>
          <button
            onClick={() => handleChoice('accepted')}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Accept all
          </button>
          <button
            onClick={() => handleChoice('declined')}
            aria-label="Dismiss"
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
