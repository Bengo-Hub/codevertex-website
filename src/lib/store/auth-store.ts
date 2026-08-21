'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  storeVerifier,
  storeState,
  consumeVerifier,
} from '@/lib/auth/pkce';

import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  exchangeCodeForTokens,
  fetchProfile,
} from '@/lib/auth/sso-api';

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
  is_platform_owner?: boolean;

  /** Local Digitika role */
  digitikaRole?: string | null;

  /** Local permissions */
  permissions?: string[];

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

  login: (
    returnTo?: string,
    localRole?: 'admin' | 'student'
  ) => Promise<void>;

  handleCallback: (code: string, callbackUrl: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

/**
 * Local development users.
 *
 * These accounts exist ONLY when:
 *
 * NODE_ENV=development
 * NEXT_PUBLIC_SSO_DISABLED=true
 */
const LOCAL_USERS = {
  admin: {
    id: 'local-admin',
    email: 'admin@codevertexafrica.com',
    name: 'Local Admin',
    fullName: 'Local Admin',
    role: 'admin',
    roles: ['admin'],
    tenant_id: 'codevertex',
    tenant_slug: 'codevertex',
    is_platform_owner: true,
    permissions: ['*'],
    token: 'local-development-admin-token',
  },

  student: {
  id: 'student-1',
  email: 'student@example.com',
  name: 'Test Student',
  fullName: 'Test Student',
  role: 'student',
  roles: ['student'],
  tenant_id: 'codevertex',
  tenant_slug: 'codevertex',
  is_platform_owner: false,
  permissions: [],
  token: 'local-development-student-token',
},
} as const;

function isLocalDevelopment(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_SSO_DISABLED === 'true'
  );
}

async function fetchDigitikaProfile(
  accessToken: string
): Promise<{
  digitikaRole: string | null;
  permissions: string[];
}> {
  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        digitikaRole: null,
        permissions: [],
      };
    }

    const data = await res.json();

    return {
      digitikaRole: data.digitikaRole ?? null,
      permissions: Array.isArray(data.permissions)
        ? data.permissions
        : [],
    };
  } catch {
    return {
      digitikaRole: null,
      permissions: [],
    };
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      user: null,
      session: null,
      accessToken: null,

      /**
       * Login.
       *
       * LOCAL:
       *   login('/admin', 'admin')
       *   login('/student', 'student')
       *
       * If localRole is omitted:
       *   /student -> student
       *   everything else -> admin
       *
       * PRODUCTION:
       *   Normal SSO/PKCE flow is preserved.
       */
      login: async (
        returnTo?: string,
        localRole?: 'admin' | 'student'
      ) => {
        try {
          if (isLocalDevelopment()) {
            const role =
              localRole ??
              (returnTo?.startsWith('/student')
                ? 'student'
                : 'admin');

            const localUser = LOCAL_USERS[role];

            const user: UserProfile = {
              id: localUser.id,
              email: localUser.email,
              name: localUser.name,
              fullName: localUser.fullName,
              role: localUser.role,
              roles: [...localUser.roles],
              tenant_id: localUser.tenant_id,
              tenant_slug: localUser.tenant_slug,
              is_platform_owner: localUser.is_platform_owner,
              permissions: [...localUser.permissions],
            };

            const session: Session = {
              accessToken: localUser.token,
              refreshToken: '',
              expiresAt: new Date(
                Date.now() + 86400000
              ).toISOString(),
            };

            set({
              status: 'authenticated',
              user,
              session,
              accessToken: session.accessToken,
            });

            /**
             * Create the local server-side session cookie.
             */
            const response = await fetch(
              '/api/auth/session',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  accessToken: session.accessToken,
                }),
              }
            );

            if (!response.ok) {
              throw new Error(
                'Failed to create local session'
              );
            }

            if (returnTo) {
              sessionStorage.setItem(
                'sso_return_to',
                returnTo
              );
            }

            /**
             * IMPORTANT:
             * Use the requested destination instead of
             * sending the user back to the landing page.
             */
            window.location.href =
              returnTo ||
              (role === 'admin' ? '/admin' : '/student');

            return;
          }

          /**
           * PRODUCTION SSO
           */
          const verifier = generateCodeVerifier();
          const challenge =
            await generateCodeChallenge(verifier);

          const state = generateState();

          storeVerifier(verifier);
          storeState(state);

          if (returnTo) {
            sessionStorage.setItem(
              'sso_return_to',
              returnTo
            );
          }

          const callbackUrl =
            `${window.location.origin}/auth/callback`;

          window.location.href =
            buildAuthorizeUrl(
              challenge,
              state,
              callbackUrl
            );
        } catch (error) {
          console.error('Login failed:', error);

          set({
            status: 'error',
          });
        }
      },

      /**
       * Production SSO callback.
       */
      handleCallback: async (
        code: string,
        callbackUrl: string
      ) => {
        set({
          status: 'loading',
        });

        const verifier = consumeVerifier();

        if (!verifier) {
          set({
            status: 'error',
          });

          return;
        }

        try {
          const tokens =
            await exchangeCodeForTokens({
              code,
              codeVerifier: verifier,
              redirectUri: callbackUrl,
            });

          const session: Session = {
            accessToken: tokens.access_token,
            refreshToken:
              tokens.refresh_token || '',
            expiresAt: new Date(
              Date.now() +
                (tokens.expires_in || 3600) * 1000
            ).toISOString(),
          };

          set({
            session,
            accessToken: session.accessToken,
          });

          const raw =
            await fetchProfile(
              session.accessToken
            );

          const digitika =
            await fetchDigitikaProfile(
              session.accessToken
            );

          const user: UserProfile = {
            id: raw.id ?? raw.sub,
            email: raw.email,
            name: raw.name ?? raw.fullName,
            fullName:
              raw.fullName ?? raw.name,
            role:
              (raw.roles as string[])?.[0] ??
              raw.role,
            roles: raw.roles ?? [],
            avatar_url: raw.avatar_url,
            tenant_id: raw.tenant_id,
            tenant_slug: raw.tenant_slug,
            ...raw,

            digitikaRole:
              digitika.digitikaRole,

            permissions:
              digitika.permissions,
          };

          set({
            user,
            status: 'authenticated',
          });
        } catch (error) {
          console.error(
            'SSO callback failed:',
            error
          );

          set({
            status: 'error',
            session: null,
            accessToken: null,
          });
        }
      },

      /**
       * Logout.
       */
      logout: async () => {
        await fetch(
          '/api/auth/session',
          {
            method: 'DELETE',
          }
        ).catch(() => {
          // Ignore logout API errors.
        });

        set({
          status: 'idle',
          user: null,
          session: null,
          accessToken: null,
        });

        try {
          localStorage.removeItem('cv-auth');
        } catch {
          // Ignore.
        }

        try {
          sessionStorage.clear();
        } catch {
          // Ignore.
        }

        if (isLocalDevelopment()) {
          window.location.href = '/';
          return;
        }

        window.location.href =
          buildLogoutUrl();
      },

      /**
       * Restore authentication after page refresh.
       *
       * IMPORTANT:
       * Local users are restored directly from the
       * persisted local session instead of attempting
       * to contact production SSO.
       */
      initialize: async () => {
        const {
          session,
          user,
        } = get();

        if (
          isLocalDevelopment() &&
          session?.accessToken
        ) {
          const isValidLocalToken =
            session.accessToken ===
              LOCAL_USERS.admin.token ||
            session.accessToken ===
              LOCAL_USERS.student.token;

          if (!isValidLocalToken) {
            set({
              status: 'idle',
              session: null,
              user: null,
              accessToken: null,
            });

            return;
          }

          if (user) {
            set({
              status: 'authenticated',
              accessToken:
                session.accessToken,
            });

            return;
          }

          const localUser =
            session.accessToken ===
            LOCAL_USERS.student.token
              ? LOCAL_USERS.student
              : LOCAL_USERS.admin;

          set({
            status: 'authenticated',

            user: {
              id: localUser.id,
              email: localUser.email,
              name: localUser.name,
              fullName: localUser.fullName,
              role: localUser.role,
              roles: [...localUser.roles],
              tenant_id:
                localUser.tenant_id,
              tenant_slug:
                localUser.tenant_slug,
              is_platform_owner:
                localUser.is_platform_owner,
              permissions: [
                ...localUser.permissions,
              ],
            },

            accessToken:
              session.accessToken,
          });

          return;
        }

        /**
         * Production session restoration.
         */
        if (!session?.accessToken) {
          set({
            status: 'idle',
          });

          return;
        }

        try {
          const raw =
            await fetchProfile(
              session.accessToken
            );

          const digitika =
            await fetchDigitikaProfile(
              session.accessToken
            );

          const user: UserProfile = {
            id: raw.id ?? raw.sub,
            email: raw.email,
            name: raw.name ?? raw.fullName,
            fullName:
              raw.fullName ?? raw.name,
            role:
              (raw.roles as string[])?.[0] ??
              raw.role,
            roles: raw.roles ?? [],
            avatar_url:
              raw.avatar_url,
            tenant_id:
              raw.tenant_id,
            tenant_slug:
              raw.tenant_slug,
            ...raw,

            digitikaRole:
              digitika.digitikaRole,

            permissions:
              digitika.permissions,
          };

          set({
            user,
            status: 'authenticated',
          });
        } catch {
          set({
            status: 'idle',
            session: null,
            user: null,
            accessToken: null,
          });
        }
      },
    }),

    {
      name: 'cv-auth',

      storage: createJSONStorage(
        () => localStorage
      ),

      partialize: (state) => ({
        session: state.session,
        user: state.user,
        accessToken:
          state.accessToken,
      }),

      onRehydrateStorage: () =>
        (state) => {
          if (
            state?.session?.accessToken &&
            state?.user
          ) {
            useAuthStore.setState({
              status: 'authenticated',
            });
          } else if (
            state?.session?.accessToken
          ) {
            useAuthStore.setState({
              status: 'loading',
            });

            state.initialize();
          } else {
            useAuthStore.setState({
              status: 'idle',
            });
          }
        },
    }
  )
);