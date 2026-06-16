const KEY = 'archivum_pending_debrief';

export function markDebriefPending(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(KEY, '1');
}

export function clearDebriefPending(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(KEY);
}

export function isDebriefPending(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(KEY) === '1';
}
