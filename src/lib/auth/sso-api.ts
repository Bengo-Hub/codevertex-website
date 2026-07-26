// Auth-service API: authorize URL, token exchange, profile, logout.
// API is at sso.codevertexafrica.com; accounts UI at accounts.codevertexafrica.com.

const SSO_API_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://sso.codevertexafrica.com';
const SSO_CLIENT_ID = process.env.NEXT_PUBLIC_SSO_CLIENT_ID || 'codevertex-website';

export interface TokenExchangeParams {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export function buildAuthorizeUrl(codeChallenge: string, state: string, redirectUri: string): string {
  const url = new URL('/api/v1/authorize', SSO_API_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', SSO_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'openid profile email offline_access');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export function buildLogoutUrl(): string {
  const url = new URL('/api/v1/auth/logout', SSO_API_URL);
  url.searchParams.set('post_logout_redirect_uri', process.env.NEXT_PUBLIC_SSO_URL || 'https://accounts.codevertexafrica.com');
  return url.toString();
}

export async function exchangeCodeForTokens(params: TokenExchangeParams) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: SSO_CLIENT_ID,
    code_verifier: params.codeVerifier,
  });

  const res = await fetch(`${SSO_API_URL}/api/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.error || 'Token exchange failed');
  }

  return res.json();
}

export async function fetchProfile(accessToken: string) {
  const res = await fetch(`${SSO_API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}
