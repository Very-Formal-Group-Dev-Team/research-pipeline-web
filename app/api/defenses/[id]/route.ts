import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getAuthHeaders, parseProxyJson } from '@/lib/server/apiProxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await fetch(`${getApiBaseUrl()}/defenses/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(req),
    });
    const data = await parseProxyJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 502 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await fetch(`${getApiBaseUrl()}/defenses/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(req),
      body: JSON.stringify(body),
    });
    const data = await parseProxyJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 502 });
  }
}
