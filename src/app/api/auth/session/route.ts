import {
  NextRequest,
  NextResponse,
} from 'next/server';
import { signSessionPayload } from '@/lib/auth/session-crypto';

const SSO_API_URL =
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
  'https://sso.codevertexafrica.com';

const SESSION_MAX_AGE = 3600; // 1 hour

const LOCAL_SESSIONS = {
  'local-development-admin-token': {
    userId: 'local-admin',
    role: 'admin',
  },
'local-development-student-token': {
  userId: 'student-1',
  role: 'student',
},
} as const;

function isLocalDevelopment(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_SSO_DISABLED === 'true'
  );
}

export async function POST(
  req: NextRequest
) {
  /**
   * LOCAL DEVELOPMENT ONLY
   */
  if (isLocalDevelopment()) {
    let accessToken: string | undefined;

    try {
      ({
        accessToken,
      } = await req.json());
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
        },
        {
          status: 400,
        }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Missing accessToken',
        },
        {
          status: 400,
        }
      );
    }

    const localSession =
      LOCAL_SESSIONS[
        accessToken as keyof typeof LOCAL_SESSIONS
      ];

    if (!localSession) {
      return NextResponse.json(
        {
          error: 'Invalid local token',
        },
        {
          status: 401,
        }
      );
    }

    const exp =
      Math.floor(Date.now() / 1000) +
      SESSION_MAX_AGE;

    const payload = await signSessionPayload({
      userId: localSession.userId,
      role: localSession.role,
      exp,
    });

    const res =
      NextResponse.json({
        ok: true,
        role:
          localSession.role,
      });

    res.cookies.set(
      'cv_session',
      payload,
      {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge:
          SESSION_MAX_AGE,
        secure: false,
      }
    );

    return res;
  }

  /**
   * PRODUCTION SSO
   */
  let accessToken: string | undefined;

  try {
    ({
      accessToken,
    } = await req.json());
  } catch {
    return NextResponse.json(
      {
        error: 'Invalid JSON',
      },
      {
        status: 400,
      }
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      {
        error: 'Missing accessToken',
      },
      {
        status: 400,
      }
    );
  }

  const profileRes =
    await fetch(
      `${SSO_API_URL}/api/v1/auth/me`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      }
    );

  if (!profileRes.ok) {
    return NextResponse.json(
      {
        error:
          'Invalid or expired token',
      },
      {
        status: 401,
      }
    );
  }

  const profile =
    await profileRes.json();

  const role: string =
    (Array.isArray(profile.roles) &&
      profile.roles[0]) ??
    profile.role ??
    'member';

  const userId: string =
    profile.id ??
    profile.sub ??
    '';

  const exp =
    Math.floor(Date.now() / 1000) +
    SESSION_MAX_AGE;

  const payload =
    await signSessionPayload({
      userId,
      role,
      exp,
    });

  const res =
    NextResponse.json({
      ok: true,
      role,
    });

  res.cookies.set(
    'cv_session',
    payload,
    {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge:
        SESSION_MAX_AGE,
      secure:
        process.env.NODE_ENV ===
        'production',
    }
  );

  return res;
}

export async function DELETE() {
  const res =
    NextResponse.json({
      ok: true,
    });

  res.cookies.delete(
    'cv_session'
  );

  return res;
}