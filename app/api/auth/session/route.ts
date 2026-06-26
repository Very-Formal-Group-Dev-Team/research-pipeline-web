import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/server/apiProxy';

const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session_token')?.value?.trim();
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    const user = await res.json();
    return NextResponse.json({ authenticated: true, token, user });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { token?: string; rememberMe?: boolean };
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const rememberMe = body.rememberMe !== false;
  const response = NextResponse.json({ success: true });
  response.cookies.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(rememberMe ? { maxAge: SESSION_MAX_AGE } : {}),
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
