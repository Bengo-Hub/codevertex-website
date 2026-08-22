/**
 * The cv_session cookie previously carried its payload as plain
 * base64url(JSON) with no signature — anyone could hand-craft
 * `{"userId":"x","role":"admin","exp":9999999999}`, base64url-encode it,
 * and set it as their own cookie to get full admin access, since
 * resolveCookieSession() (and the local-dev branch of extractBearerToken())
 * just decoded and trusted it.
 *
 * This wraps that same payload with an HMAC-SHA256 signature so it can't be
 * forged. The cookie's *shape* and every call site's behavior is unchanged —
 * this only adds a signature that gets checked before the payload is trusted.
 * Uses Web Crypto (crypto.subtle) so it works identically whether called
 * from a route handler (Node) or middleware (Edge) — no Buffer, no
 * runtime-specific APIs.
 */

const enc = new TextEncoder();

function toB64Url(bytes: Uint8Array): string {
  let str = '';
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(b64url: string): Uint8Array {
  const pad = (4 - (b64url.length % 4)) % 4;
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  const str = atob(b64);
  return Uint8Array.from(str, (c) => c.charCodeAt(0));
}

// Local dev needs to work without any secret being configured (the whole
// point of the bypass is "clone and run"), so it falls back to a fixed,
// well-known dev-only secret — never used when NODE_ENV==='production',
// and getKey() below refuses to fall back to it in production even if
// someone forgot to set SESSION_SECRET there.
const LOCAL_DEV_FALLBACK_SECRET = 'local-development-only-not-a-real-secret';

async function getKey(): Promise<CryptoKey> {
  let secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production');
    }
    secret = LOCAL_DEV_FALLBACK_SECRET;
  }
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export interface SessionPayload {
  userId: string;
  role: string;
  exp: number;
}

/** Signs a session payload. Returns the exact string to store as the cv_session cookie value. */
export async function signSessionPayload(payload: SessionPayload): Promise<string> {
  const payloadB64 = toB64Url(enc.encode(JSON.stringify(payload)));
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  return `${payloadB64}.${toB64Url(new Uint8Array(sig))}`;
}

/**
 * Verifies and decodes a cv_session cookie value produced by signSessionPayload().
 * Returns null on missing/malformed/expired/tampered input — callers already
 * treat a null/invalid cookie as "not logged in", so this is a drop-in
 * replacement for the old raw JSON.parse(Buffer.from(...)) decode.
 */
export async function verifySessionPayload(cookieValue: string | undefined | null): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf('.');
  if (dot === -1) return null;
  const payloadB64 = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  if (!payloadB64 || !sig) return null;

  try {
    const key = await getKey();
    const valid = await crypto.subtle.verify('HMAC', key, fromB64Url(sig), enc.encode(payloadB64));
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromB64Url(payloadB64))) as SessionPayload;
    if (typeof payload?.userId !== 'string' || !payload.userId) return null;
    if (typeof payload?.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
