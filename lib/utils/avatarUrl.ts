/**
 * Resolve avatar paths for display in the browser.
 * Prefer same-origin /uploads paths so Next.js rewrites proxy to the API.
 */
export function resolveAvatarUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/')) return trimmed;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (path.startsWith('/uploads/')) return path;
  const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');
  return `${apiOrigin}${path}`;
}
