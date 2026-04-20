/**
 * Centralized API client for communicating with the dedicated backend server.
 *
 * All frontend code should use this client (or the domain-specific services
 * that wrap it) instead of making direct database / auth-provider calls.
 *
 * TODO: Update API_BASE_URL once the backend is deployed.
 */

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/** Standard shape returned by every API helper. */
export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Returns the `Authorization` header value when a session token is available.
 * The token is stored as a cookie named `session_token` by the backend after
 * login / OAuth callback.
 */
function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null; // SSR guard
  const match = document.cookie.match(/(?:^|;\s*)session_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Build common headers for every request. */
function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getSessionToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

/** Generic fetch wrapper that returns a typed `ApiResponse`. */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(path);
  const isFormData = options.body instanceof FormData;

  const headers = buildHeaders(options.headers as HeadersInit | undefined);
  // Let the browser set Content-Type (with boundary) for FormData
  if (isFormData) headers.delete('Content-Type');

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // send cookies cross-origin
    });

    const contentType = res.headers.get('Content-Type') || '';
    const body = contentType.includes('application/json') ? await res.json() : null;

    if (!res.ok) {
      return {
        data: null,
        error: body?.error || body?.message || res.statusText,
        status: res.status,
      };
    }

    return { data: body as T, error: null, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message, status: 0 };
  }
}

// ─── Convenience methods ────────────────────────────────────────────────────

export function get<T>(path: string) {
  return request<T>(path, { method: 'GET' });
}

export function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export function put<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function patch<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

export default { get, post, put, patch, del };
