/**
 * Stable unique numeric IDs for calendar events (React keys).
 * Hashing the full source + record id avoids collisions from truncated UUID digits.
 */
export function calendarEventId(source: string, recordId: string): number {
  const key = `${source}:${recordId}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 2147483646) + 1;
}
