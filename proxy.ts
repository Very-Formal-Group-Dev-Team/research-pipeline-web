import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  canAccessPath,
  getRoleHomePath,
  isRoleProtectedPath,
} from '@/lib/auth/roleAccess';

const AUTH_REQUIRED_PREFIXES = ['/student', '/adviser', '/coordinator', '/onboarding', '/defenses'];

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

async function fetchUserRole(token: string): Promise<{ role: string | null; authenticated: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `session_token=${encodeURIComponent(token)}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { role: null, authenticated: false };
    }

    const user = (await res.json()) as { role?: string | null };
    return {
      role: typeof user.role === 'string' ? user.role : null,
      authenticated: true,
    };
  } catch {
    return { role: null, authenticated: false };
  }
}

function requiresAuthentication(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  if (!requiresAuthentication(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { role, authenticated } = await fetchUserRole(token);

  if (!authenticated) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('session_token', '', { path: '/', maxAge: 0 });
    return response;
  }

  if (pathname.startsWith('/onboarding')) {
    return NextResponse.next();
  }

  if (!role && isRoleProtectedPath(pathname)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  if (role && isRoleProtectedPath(pathname) && !canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(getRoleHomePath(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
