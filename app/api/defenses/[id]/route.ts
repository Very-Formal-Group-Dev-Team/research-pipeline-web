import { NextRequest, NextResponse } from 'next/server';

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_BASE_URL = (() => {
  const base = RAW_API_BASE_URL.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
})();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await fetch(`${API_BASE_URL}/defenses/${id}`, {
    method: 'GET',
    headers: {
      cookie: req.headers.get('cookie') || '',
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const res = await fetch(`${API_BASE_URL}/defenses/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
