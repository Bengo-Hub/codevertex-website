'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  generateCodeVerifier, generateCodeChallenge, generateState,
  storeVerifier, storeState, consumeVerifier, consumeState,
} from '@/lib/auth/pkce';
import { buildAuthorizeUrl, buildLogoutUrl, exchangeCodeForTokens, fetchProfile } from '@/lib/auth/sso-api';

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  fullName?: string;
  role?: string;
  roles?: string[];
  avatar_url?: string;
  tenant_id?: string;
  tenant_slug?: string;
  [key: string]: unknown;
}

interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  user: UserProfile | null;
  session: Session | null;
  accessToken: string | null;

  login: (returnTo?: string) => Promise<void>;
  handleCallback: (code: string, callbackUrl: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      user: null,
      session: null,
      accessToken: null,

      login: async (returnTo?: string) => {
        try {
          const verifier = generateCodeVerifier();
          const challenge = await generateCodeChallenge(verifier);
          const state = generateState();

          storeVerifier(verifier);
          storeState(state);

          if (returnTo) sessionStorage.setItem('sso_return_to', returnTo);

          const callbackUrl = `${window.location.origin}/auth/callback`;
          window.location.href = buildAuthorizeUrl(challenge, state, callbackUrl);
        } catch {
          set({ status: 'error' });
        }
      },

      handleCallback: async (code: string, callbackUrl: string) => {
        set({ status: 'loading' });
        const verifier = consumeVerifier();
        if (!verifier) { set({ status: 'error' }); return; }

        try {
          const tokens = await exchangeCodeForTokens({ code, codeVerifier: verifier, redirectUri: callbackUrl });

          const session: Session = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || '',
            expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          };

          set({ session, accessToken: session.accessToken });

          const raw = await fetchProfile(session.accessToken);
          const user: UserProfile = {
            id: raw.id ?? raw.sub,
            email: raw.email,
            name: raw.name ?? raw.fullName,
            fullName: raw.fullName ?? raw.name,
            role: (raw.roles as string[])?.[0] ?? raw.role,
            roles: raw.roles ?? [],
            avatar_url: raw.avatar_url,
            tenant_id: raw.tenant_id,
            tenant_slug: raw.tenant_slug,
            ...raw,
          };

          set({ user, status: 'authenticated' });
        } catch {
          set({ status: 'error', session: null, accessToken: null });
        }
      },

      logout: async () => {
        // Clear server-side session cookie used by middleware
        await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => { /* no-op */ });
        set({ status: 'idle', user: null, session: null, accessToken: null });
        try { localStorage.removeItem('cv-auth'); } catch { /* no-op */ }
        try { sessionStorage.clear(); } catch { /* no-op */ }
        window.location.href = buildLogoutUrl();
      },

      initialize: async () => {
        const { session } = get();
        if (!session?.accessToken) { set({ status: 'idle' }); return; }
        try {
          const raw = await fetchProfile(session.accessToken);
          const user: UserProfile = {
            id: raw.id ?? raw.sub,
            email: raw.email,
            name: raw.name ?? raw.fullName,
            fullName: raw.fullName ?? raw.name,
            role: (raw.roles as string[])?.[0] ?? raw.role,
            roles: raw.roles ?? [],
            avatar_url: raw.avatar_url,
            tenant_id: raw.tenant_id,
            tenant_slug: raw.tenant_slug,
            ...raw,
          };
          set({ user, status: 'authenticated' });
        } catch {
          set({ status: 'idle', session: null, user: null, accessToken: null });
        }
      },
    }),
    {
      name: 'cv-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ session: s.session, user: s.user, accessToken: s.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.session?.accessToken && state?.user) {
          useAuthStore.setState({ status: 'authenticated' });
        } else if (state?.session?.accessToken) {
          useAuthStore.setState({ status: 'loading' });
          state.initialize();
        } else {
          useAuthStore.setState({ status: 'idle' });
        }
      },
    }
  )
);
