import { useAuthStore } from '@/lib/store/auth-store';

/** fetch() with the current SSO access token attached — required by the RBAC-guarded /api/admin/{users,roles,permissions} routes. */
export function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
