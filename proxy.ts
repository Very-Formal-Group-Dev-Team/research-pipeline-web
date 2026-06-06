import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/student', '/adviser', '/coordinator', '/onboarding', '/defenses'];

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};