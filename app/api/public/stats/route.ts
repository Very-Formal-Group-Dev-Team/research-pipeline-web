import { NextResponse } from 'next/server';

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_BASE_URL = (() => {
  const base = RAW_API_BASE_URL.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
})();

export const dynamic = 'force-dynamic';

function parseCount(value: unknown): number {
  if (value == null) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  try {
    const res = await fetch(`${API_BASE_URL}/public/stats`, { cache: 'no-store' });
    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid response from API server' }, { status: 502 });
    }

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({
      totalProjects: parseCount(data.totalProjects),
      totalUsers: parseCount(data.totalUsers),
      finishedProjects: parseCount(data.finishedProjects),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to API server' }, { status: 502 });
  }
}
