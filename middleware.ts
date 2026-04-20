import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/student', '/adviser', '/coordinator', '/onboarding'];
const AUTH_PATHS = ['/login', '/register'];

/**
 * Middleware — passthrough for frontend demo (no auth checks).
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Don't perform client auth-page redirects here. Client has the
  // full session/profile context and will route to onboarding or
  // dashboard as appropriate. Server-side middleware should only
  // protect pages that require a session token.

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
