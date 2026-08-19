/**
 * auth-api stores the user's display name/avatar in a freeform `profile` JSON map
 * (`map[string]any` in Go — see auth-api/internal/httpapi/handlers/user_handler.go
 * `userResponse.Profile` and auth_handler.go `userViewFromEnt`), never flattened to a
 * top-level `full_name`/`fullName` field. The key used inside that map is NOT
 * consistent across how the user was created:
 *   - normal signup/OAuth              -> profile.name
 *   - some auth-api seed scripts       -> profile.full_name
 *   - Google OAuth avatar              -> profile.picture
 *   - manual/admin-set avatar          -> profile.avatar_url
 * Check every known key so names/avatars actually populate regardless of origin.
 */
export function extractProfileName(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null;
  const p = profile as Record<string, unknown>;
  const name = p.name ?? p.full_name ?? p.fullName;
  return typeof name === 'string' && name.trim() ? name : null;
}

export function extractProfileAvatar(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null;
  const p = profile as Record<string, unknown>;
  const avatar = p.avatar_url ?? p.picture;
  return typeof avatar === 'string' && avatar.trim() ? avatar : null;
}
