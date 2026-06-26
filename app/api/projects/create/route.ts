import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getAuthHeaders, parseProxyJson } from '@/lib/server/apiProxy';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const headers = getAuthHeaders(req);
    delete headers['Content-Type'];

    const res = await fetch(`${getApiBaseUrl()}/projects`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await parseProxyJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 502 });
  }
}
