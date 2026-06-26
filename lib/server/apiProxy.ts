import type { NextRequest } from 'next/server';

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_BASE_URL = (() => {
  const base = RAW_API_BASE_URL.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
})();

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const sessionToken = req.cookies.get('session_token')?.value;
  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }
  const cookie = req.headers.get('cookie');
  if (cookie) headers.cookie = cookie;
  return headers;
}

export async function parseProxyJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Invalid response from server' };
  }
}
