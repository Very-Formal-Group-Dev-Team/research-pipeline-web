import { NextResponse } from 'next/server';
import { getApiBaseUrl, parseProxyJson } from '@/lib/server/apiProxy';

export async function GET() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/public/stats`, { cache: 'no-store' });
    const data = await parseProxyJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 502 });
  }
}
