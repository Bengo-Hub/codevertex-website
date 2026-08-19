import { PrismaClient } from '@prisma/client';
import {
  DIGITIKA_PERMISSIONS,
  DIGITIKA_ROLE_DEFAULTS,
} from '../../src/lib/digitika-rbac-catalog';

/**
 * Seeds the Digitika admin-panel RBAC catalog (permissions + system roles).
 * Idempotent and additive-only for existing rows — see rationale on
 * DIGITIKA_ROLE_DEFAULTS in src/lib/digitika-rbac-catalog.ts.
 */
export async function seedDigitikaRbac(prisma: PrismaClient) {
  console.log(`\n🔐 Seeding ${DIGITIKA_PERMISSIONS.length} Digitika permissions...`);
  for (const perm of DIGITIKA_PERMISSIONS) {
    await prisma.digitikaPermission.upsert({
      where: { code: perm.code },
      create: perm,
      update: { module: perm.module, action: perm.action, description: perm.description },
    });
  }
  console.log('  ✓ Permission catalog in sync');

  for (const roleDef of DIGITIKA_ROLE_DEFAULTS) {
    const existing = await prisma.digitikaRole.findUnique({ where: { code: roleDef.code } });
    const role = await prisma.digitikaRole.upsert({
      where: { code: roleDef.code },
      create: { code: roleDef.code, name: roleDef.name, description: roleDef.description, isSystem: true },
      update: { name: roleDef.name, description: roleDef.description, isSystem: true },
    });

    if (!existing) {
      // First time this role has ever been seeded — attach its default permission set.
      const perms = await prisma.digitikaPermission.findMany({ where: { code: { in: roleDef.permissionCodes } } });
      await prisma.digitikaRolePermission.createMany({
        data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
      console.log(`  ✓ Created role "${roleDef.name}" with ${perms.length} permissions`);
    } else if (roleDef.code === 'digitika_admin') {
      // The admin role is always kept whole — additively reconcile any newly added
      // permission codes without ever revoking one an operator may have (they can't,
      // since it's locked in the UI, but this also self-heals if the catalog grows).
      const perms = await prisma.digitikaPermission.findMany({ where: { code: { in: roleDef.permissionCodes } } });
      await prisma.digitikaRolePermission.createMany({
        data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
      console.log(`  ↺ Reconciled "${roleDef.name}" permissions (additive)`);
    } else {
      console.log(`  · "${roleDef.name}" already exists — leaving its permission matrix as configured`);
    }
  }
}

/**
 * Best-effort push of the digitika_admin/digitika_staff role catalogue into auth-api's
 * shared Role registry (S2S), so they're assignable via auth-ui / TenantMembership.roles
 * the same way pos-api/library-api/erp-api register their own service roles. This is
 * purely for fleet-wide visibility — enforcement of what each role can actually DO inside
 * codevertex-website is always resolved locally (see src/lib/auth/rbac.ts), never from
 * whatever auth-api's registry happens to say. Failure here must never break a deploy.
 */
export async function pushDigitikaRolesToAuthRegistry() {
  const key = process.env.INTERNAL_SERVICE_KEY;
  if (!key) {
    console.log('  ⚠ INTERNAL_SERVICE_KEY not set — skipping auth-api role registry push');
    return;
  }
  const authUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://sso.codevertexafrica.com';

  try {
    const res = await fetch(`${authUrl}/api/v1/s2s/roles/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify({
        service: 'digitika',
        roles: DIGITIKA_ROLE_DEFAULTS.map((r) => ({
          role_code: r.code,
          name: r.name,
          description: r.description,
          scope: 'digitika',
        })),
      }),
    });
    if (!res.ok) {
      console.log(`  ⚠ auth-api role registry push responded ${res.status} — will retry on next restart`);
      return;
    }
    console.log('  ✓ Pushed digitika_admin/digitika_staff to auth-api role registry');
  } catch (err) {
    console.log(`  ⚠ auth-api role registry push failed (non-fatal): ${err instanceof Error ? err.message : err}`);
  }
}
