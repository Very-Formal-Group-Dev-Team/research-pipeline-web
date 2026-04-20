import { NextResponse } from 'next/server'

/**
 * OAuth callback route (demo stub).
 * In the demo version, this just redirects to onboarding.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const error = requestUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, requestUrl.origin))
  }

  return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
}
