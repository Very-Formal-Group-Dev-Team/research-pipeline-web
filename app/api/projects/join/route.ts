import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getAuthHeaders, parseProxyJson } from '@/lib/server/apiProxy';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${getApiBaseUrl()}/projects/join`, {
      method: 'POST',
      headers: getAuthHeaders(req),
      body: JSON.stringify(body),
    });

    const data = await parseProxyJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 502 });
  }
}
