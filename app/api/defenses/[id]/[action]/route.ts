import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getAuthHeaders, parseProxyJson } from '@/lib/server/apiProxy';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  try {
    const { id, action } = await params;

    if (!['cancel', 'reschedule', 'complete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const body = action === 'reschedule' ? await req.json() : undefined;

    const res = await fetch(`${getApiBaseUrl()}/defenses/${id}/${action}`, {
      method: 'PATCH',
      headers: getAuthHeaders(req),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await parseProxyJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 502 });
  }
}
