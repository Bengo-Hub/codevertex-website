import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ADMIN_BYPASS_ROLES } from '@/lib/digitika-rbac-catalog';
import {
  extractProfileName,
  extractProfileAvatar,
} from '@/lib/auth/sso-profile';

export const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
  'https://sso.codevertexafrica.com';

const PLATFORM_TENANT_SLUG = 'codevertex';

let cachedPlatformTenantId: string | null = null;

export interface DigitikaSession {
  userId: string;
  email: string;
  fullName: string | null;
  accessToken: string;
  isBypass: boolean;
  digitikaRoleCode: string | null;
  permissions: string[];
}

function isLocalDevelopment(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_SSO_DISABLED === 'true'
  );
}

/**
 * Resolve the Codevertex platform tenant ID.
 */
export async function resolvePlatformTenantId(): Promise<string | null> {
  if (cachedPlatformTenantId) {
    return cachedPlatformTenantId;
  }

  try {
    const res = await fetch(
      `${AUTH_API_URL}/api/v1/tenants/by-slug/${PLATFORM_TENANT_SLUG}`,
      {
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return null;
    }

    const body = await res.json();

    const id =
      body?.id ??
      body?.tenant_id ??
      body?.tenant?.id ??
      null;

    if (id) {
      cachedPlatformTenantId = id;
    }

    return id;
  } catch {
    return null;
  }
}

/**
 * Extract an SSO Bearer token.
 *
 * In local development, the cv_session cookie is converted into
 * one of the local development tokens.
 */
function extractBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization');

  if (authorization?.startsWith('Bearer ')) {
    const token = authorization
      .slice('Bearer '.length)
      .trim();

    if (token) {
      return token;
    }
  }

  if (isLocalDevelopment()) {
    const sessionCookie =
      req.cookies.get('cv_session')?.value;

    if (!sessionCookie) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(
          sessionCookie,
          'base64url'
        ).toString('utf8')
      );

      if (
        typeof payload?.exp !== 'number' ||
        payload.exp <= Math.floor(Date.now() / 1000)
      ) {
        return null;
      }

      if (payload.userId === 'local-admin') {
        return 'local-development-admin-token';
      }

      if (payload.userId === 'student-1') {
        return 'local-development-student-token';
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Read the cv_session cookie created by /api/auth/session.
 *
 * The production session cookie contains:
 * {
 *   userId,
 *   role,
 *   exp
 * }
 *
 * We use the userId to recover the user's local SiteUser record.
 */
async function resolveCookieSession(
  req: NextRequest
): Promise<DigitikaSession | null> {
  const sessionCookie =
    req.cookies.get('cv_session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(
        sessionCookie,
        'base64url'
      ).toString('utf8')
    );

    if (
      typeof payload?.userId !== 'string' ||
      !payload.userId
    ) {
      return null;
    }

    if (
      typeof payload?.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    const userId = payload.userId;
    const role =
      typeof payload.role === 'string'
        ? payload.role
        : 'member';

    /**
     * Local development accounts.
     */
    if (isLocalDevelopment()) {
      if (userId === 'student-1') {
        return {
          userId: 'student-1',
          email: 'student@example.com',
          fullName: 'Test Student',
          accessToken:
            'local-development-student-token',
          isBypass: false,
          digitikaRoleCode: null,
          permissions: [],
        };
      }

      if (userId === 'local-admin') {
        return {
          userId: 'local-admin',
          email: 'admin@codevertexafrica.com',
          fullName: 'Local Admin',
          accessToken:
            'local-development-admin-token',
          isBypass: true,
          digitikaRoleCode: null,
          permissions: ['*'],
        };
      }
    }

    /**
     * Production:
     * Recover the user from the local SiteUser table.
     */
    const siteUser =
      await prisma.siteUser.findUnique({
        where: {
          id: userId,
        },
      });

    if (!siteUser) {
      return null;
    }

    let permissions: string[] = [];

    if (siteUser.digitikaRoleCode) {
      const roleRecord =
        await prisma.digitikaRole.findUnique({
          where: {
            code: siteUser.digitikaRoleCode,
          },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        });

      permissions =
        roleRecord?.permissions.map(
          (item) => item.permission.code
        ) ?? [];
    }

    const isBypass =
      role === 'platform_admin' ||
      role === 'superadmin' ||
      role === 'superuser' ||
      role === 'global_admin' ||
      role === 'admin' &&
        siteUser.tenantSlug === PLATFORM_TENANT_SLUG;

    return {
      userId,
      email: siteUser.email,
      fullName: siteUser.fullName,
      accessToken: '',
      isBypass,
      digitikaRoleCode:
        siteUser.digitikaRoleCode ?? null,
      permissions,
    };
  } catch (error) {
    console.error(
      'Cookie session resolution error:',
      error
    );

    return null;
  }
}

/**
 * Fetch the authenticated SSO profile.
 */
async function fetchSsoProfile(
  accessToken: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(
      `${AUTH_API_URL}/api/v1/auth/me`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Resolve the current user's Digitika session.
 *
 * Authentication order:
 *
 * 1. Bearer token
 * 2. cv_session cookie
 */
export async function resolveDigitikaSession(
  req: NextRequest
): Promise<DigitikaSession | null> {
  /**
   * First try the normal SSO Bearer token.
   */
  const accessToken =
    extractBearerToken(req);

  /**
   * Local development authentication.
   */
  if (
    isLocalDevelopment() &&
    accessToken
  ) {
    if (
      accessToken ===
      'local-development-student-token'
    ) {
      return {
        userId: 'student-1',
        email: 'student@example.com',
        fullName: 'Test Student',
        accessToken,
        isBypass: false,
        digitikaRoleCode: null,
        permissions: [],
      };
    }

    if (
      accessToken ===
      'local-development-admin-token'
    ) {
      return {
        userId: 'local-admin',
        email: 'admin@codevertexafrica.com',
        fullName: 'Local Admin',
        accessToken,
        isBypass: true,
        digitikaRoleCode: null,
        permissions: ['*'],
      };
    }
  }

  /**
   * Production SSO Bearer authentication.
   */
  if (accessToken) {
    const profile =
      await fetchSsoProfile(accessToken);

    if (profile) {
      const userId = String(
        profile.id ??
          profile.sub ??
          ''
      );

      const email = String(
        profile.email ?? ''
      );

      if (userId && email) {
        const globalRoles =
          Array.isArray(profile.roles)
            ? (profile.roles as string[])
            : [];

        const isPlatformOwner =
          Boolean(
            profile.is_platform_owner
          );

        const tenantSlug =
          (profile.tenant_slug ??
            null) as string | null;

        const isBypass =
          isPlatformOwner ||
          (
            tenantSlug ===
              PLATFORM_TENANT_SLUG &&
            globalRoles.some((role) =>
              ADMIN_BYPASS_ROLES.has(
                role
              )
            )
          );

        const fullName =
          extractProfileName(
            profile.profile
          );

        const avatarUrl =
          extractProfileAvatar(
            profile.profile
          );

        const tenantId =
          (profile.tenant_id ??
            profile.primary_tenant_id ??
            null) as string | null;

        const siteUser =
          await prisma.siteUser.upsert({
            where: {
              id: userId,
            },

            create: {
              id: userId,
              email,
              fullName,
              avatarUrl,
              role:
                globalRoles[0] ??
                'member',
              tenantId,
              tenantSlug,
              lastLoginAt:
                new Date(),
            },

            update: {
              email,
              fullName:
                fullName ??
                undefined,
              avatarUrl:
                avatarUrl ??
                undefined,
              role:
                globalRoles[0] ??
                undefined,
              tenantId:
                tenantId ??
                undefined,
              tenantSlug:
                tenantSlug ??
                undefined,
              lastLoginAt:
                new Date(),
            },
          });

        const ssoCandidateCode =
          globalRoles.find(
            (role) =>
              role ===
                'digitika_admin' ||
              role ===
                'digitika_staff'
          ) ?? null;

        let digitikaRoleCode =
          siteUser.digitikaRoleCode;

        if (
          ssoCandidateCode &&
          ssoCandidateCode !==
            digitikaRoleCode
        ) {
          const roleExists =
            await prisma.digitikaRole.findUnique(
              {
                where: {
                  code:
                    ssoCandidateCode,
                },
              }
            );

          if (roleExists) {
            digitikaRoleCode =
              ssoCandidateCode;

            await prisma.siteUser.update({
              where: {
                id: userId,
              },
              data: {
                digitikaRoleCode,
              },
            });
          }
        }

        let permissions: string[] = [];

        if (digitikaRoleCode) {
          const roleRecord =
            await prisma.digitikaRole.findUnique(
              {
                where: {
                  code:
                    digitikaRoleCode,
                },
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              }
            );

          permissions =
            roleRecord?.permissions.map(
              (item) =>
                item.permission.code
            ) ?? [];
        }

        return {
          userId,
          email,
          fullName,
          accessToken,
          isBypass,
          digitikaRoleCode,
          permissions,
        };
      }
    }
  }

  /**
   * If there was no usable Bearer token,
   * fall back to the cv_session cookie.
   */
  return resolveCookieSession(req);
}

export function hasPermission(
  session: DigitikaSession | null,
  code: string
): boolean {
  if (!session) {
    return false;
  }

  if (session.isBypass) {
    return true;
  }

  return session.permissions.includes(code);
}

export function canAccessAdminPanel(
  session: DigitikaSession | null
): boolean {
  if (!session) {
    return false;
  }

  return (
    session.isBypass ||
    session.permissions.length > 0
  );
}

export async function requirePermission(
  req: NextRequest,
  code: string
): Promise<
  | { session: DigitikaSession }
  | { response: NextResponse }
> {
  const session =
    await resolveDigitikaSession(req);

  if (!session) {
    return {
      response:
        NextResponse.json(
          {
            error: 'Unauthorized',
          },
          {
            status: 401,
          }
        ),
    };
  }

  if (
    !hasPermission(
      session,
      code
    )
  ) {
    return {
      response:
        NextResponse.json(
          {
            error: 'Forbidden',
            permission: code,
          },
          {
            status: 403,
          }
        ),
    };
  }

  return {
    session,
  };
}

export async function requireDigitikaAdmin(
  req: NextRequest
): Promise<
  | { session: DigitikaSession }
  | { response: NextResponse }
> {
  const session =
    await resolveDigitikaSession(req);

  if (!session) {
    return {
      response:
        NextResponse.json(
          {
            error: 'Unauthorized',
          },
          {
            status: 401,
          }
        ),
    };
  }

  if (
    !session.isBypass &&
    session.digitikaRoleCode !==
      'digitika_admin'
  ) {
    return {
      response:
        NextResponse.json(
          {
            error: 'Forbidden',
            reason:
              'Only Digitika Admin can manage roles/permissions',
          },
          {
            status: 403,
          }
        ),
    };
  }

  return {
    session,
  };
}