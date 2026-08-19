/**
 * Digitika admin-panel RBAC catalog — Trinity Layer 3 (local to codevertex-website).
 *
 * Permission codes follow the platform-wide `{service}.{module}.{action}` format used
 * across the fleet (see shared-docs/architecture/trinity-authorization-pattern.md).
 * Pure data, no DB/Next imports — safe to import from both `prisma/seed/*` (seeding)
 * and `src/app/api/**` (runtime permission checks) without pulling in Prisma or React.
 */

export interface DigitikaPermissionDef {
  code: string;
  module: string;
  action: 'view' | 'manage';
  description: string;
}

export interface DigitikaModuleDef {
  key: string;
  label: string;
}

// Order here drives the sidebar + permission-matrix display order.
export const DIGITIKA_MODULES: DigitikaModuleDef[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'enrollments', label: 'Enrollments' },
  { key: 'students', label: 'Students' },
  { key: 'leads', label: 'Leads' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'courses', label: 'Courses' },
  { key: 'cohorts', label: 'Cohorts' },
  { key: 'installments', label: 'Installments' },
  { key: 'discounts', label: 'Discounts' },
  { key: 'users', label: 'Users' },
  { key: 'roles', label: 'Roles' },
];

// dashboard is view-only (a landing/stats page — nothing to "manage" on it directly)
const VIEW_ONLY_MODULES = new Set(['dashboard']);

function buildPermissions(): DigitikaPermissionDef[] {
  const perms: DigitikaPermissionDef[] = [];
  for (const { key, label } of DIGITIKA_MODULES) {
    perms.push({ code: `digitika.${key}.view`, module: key, action: 'view', description: `View ${label}` });
    if (!VIEW_ONLY_MODULES.has(key)) {
      perms.push({ code: `digitika.${key}.manage`, module: key, action: 'manage', description: `Create, edit, and delete ${label}` });
    }
  }
  return perms;
}

export const DIGITIKA_PERMISSIONS: DigitikaPermissionDef[] = buildPermissions();

export function digitikaPerm(module: string, action: 'view' | 'manage'): string {
  return `digitika.${module}.${action}`;
}

const ALL_PERMISSION_CODES = DIGITIKA_PERMISSIONS.map((p) => p.code);

// Every content module except the RBAC-administration modules themselves.
const STAFF_PERMISSION_CODES = ALL_PERMISSION_CODES.filter(
  (code) => !code.startsWith('digitika.users.') && !code.startsWith('digitika.roles.')
);

export interface DigitikaRoleDef {
  code: string;
  name: string;
  description: string;
  permissionCodes: string[];
}

// Seeded, system-owned roles. `digitika_admin`'s permission set is force-reconciled
// (additively) on every seed run — see prisma/seed/digitika-rbac.ts. `digitika_staff`'s
// permission set only seeds on first creation; an admin may edit it afterwards via the
// Roles page and that customization is preserved across restarts.
export const DIGITIKA_ROLE_DEFAULTS: DigitikaRoleDef[] = [
  {
    code: 'digitika_admin',
    name: 'Digitika Admin',
    description: 'Full access to the Digitika admin panel, including user and role management.',
    permissionCodes: ALL_PERMISSION_CODES,
  },
  {
    code: 'digitika_staff',
    name: 'Digitika Staff',
    description: 'Manages Digitika LMS content (courses, cohorts, enrollments, students, leads, contacts, installments, discounts). No user or role administration.',
    permissionCodes: STAFF_PERMISSION_CODES,
  },
];

// SSO global roles that always bypass local RBAC entirely (platform-owner-tier access).
export const ADMIN_BYPASS_ROLES = new Set(['admin', 'superuser', 'platform_admin', 'superadmin']);

// Must match rbac.ts's own PLATFORM_TENANT_SLUG — duplicated here since this file is
// intentionally dependency-free (importable from prisma/seed/* with no Next/DB imports).
const PLATFORM_TENANT_SLUG = 'codevertex';

/**
 * Client-safe helper — true if the user's SSO global roles/flag grant a full bypass.
 *
 * SECURITY: `roles` is a bare, tenant-scoped role string (e.g. "admin" of the caller's OWN
 * tenant) — it must NEVER grant a bypass unless it's held specifically within the codevertex
 * platform tenant. Without checking `tenantSlug`, any customer tenant's own admin would get
 * full, unrestricted Digitika admin-panel access. `tenantSlug` is required (not optional) so a
 * call site can't silently skip this check by omitting the argument.
 */
export function hasBypassRole(roles: string[] | undefined, isPlatformOwner: boolean | undefined, tenantSlug: string | null | undefined): boolean {
  if (isPlatformOwner) return true;
  if (tenantSlug !== PLATFORM_TENANT_SLUG) return false;
  return (roles ?? []).some((r) => ADMIN_BYPASS_ROLES.has(r));
}

/** Client-safe helper — checks a merged `permissions` array (may contain the `'*'` wildcard). */
export function hasDigitikaPermission(permissions: string[] | undefined, code: string): boolean {
  if (!permissions) return false;
  return permissions.includes('*') || permissions.includes(code);
}

/**
 * Auto-maps a synced platform user's SSO global roles to a seeded Digitika role,
 * "where applicable" — used only to pre-fill a NEW user's panel access on sync
 * (never overwrites an existing manual assignment). Conservative on purpose: a
 * bare `member`/`viewer` doesn't imply Digitika program staff, so it maps to null.
 */
export function mapGlobalRolesToDigitika(roles: string[]): string | null {
  if (roles.some((r) => ADMIN_BYPASS_ROLES.has(r))) return 'digitika_admin';
  if (roles.includes('staff') || roles.includes('manager')) return 'digitika_staff';
  return null;
}

// Fleet-wide e2e/QA fixture accounts seeded by auth-api (cmd/seed/seed_users.go) and
// consumed by e2e specs across ~10 frontends. Never surface these in the Digitika Users
// page — they aren't real Digitika staff, and they must NOT be deleted at the source
// (auth-api) since doing so would break other services' login e2e tests.
const FIXTURE_STAFF_EMAIL = /^staff@[^@]+\.com$/i;
export function isFleetTestFixtureEmail(email: string): boolean {
  return email.toLowerCase() === 'demo@bengobox.dev' || FIXTURE_STAFF_EMAIL.test(email);
}
