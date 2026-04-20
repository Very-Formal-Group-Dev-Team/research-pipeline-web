import { NextRequest, NextResponse } from 'next/server';

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_BASE_URL = (() => {
  const base = RAW_API_BASE_URL.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
})();

function getAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const sessionToken = req.cookies.get('session_token')?.value;
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;
  return headers;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE_URL}/defenses`, {
      method: 'POST',
      headers: getAuthHeaders(req),
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: 'Invalid response from server' }; }

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${API_BASE_URL}/defenses/me`, {
      headers: getAuthHeaders(req),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: 'Invalid response from server' }; }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 502 });
  }
}