/**
 * Format API status values (snake_case or lowercase) for display.
 * e.g. "in_progress" → "In Progress", "pending" → "Pending"
 */
export function formatStatusLabel(status?: string | null): string {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
