export interface JitsiMeetingFields {
  meeting_room?: string | null;
  meeting_url?: string | null;
  meeting_provider?: string | null;
}

export function isOnlineModality(modality?: string | null) {
  if (!modality) return false;
  const normalized = modality.trim().toLowerCase();
  return normalized === 'online' || normalized === 'hybrid';
}

export function hasJoinableMeeting(item: JitsiMeetingFields) {
  return Boolean(normalizeJitsiJoinUrl(item.meeting_url, item.meeting_room));
}

const DEFAULT_JITSI_BASE = 'https://localhost:8443';

export function getJitsiBaseUrl(): string {
  const base =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_JITSI_BASE_URL) ||
    DEFAULT_JITSI_BASE;
  return base.replace(/\/+$/, '');
}

/** Use HTTPS :8443; rewrite old http://localhost:8000 links from the database. */
export function normalizeJitsiJoinUrl(
  meetingUrl?: string | null,
  meetingRoom?: string | null,
): string | null {
  const normalizedBase = getJitsiBaseUrl();

  if (meetingRoom?.trim()) {
    return `${normalizedBase}/${encodeURIComponent(meetingRoom.trim())}`;
  }

  const trimmed = meetingUrl?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const room = parsed.pathname.replace(/^\/+/, '');
    if (!room) return null;

    const isLegacyLocal =
      parsed.hostname === 'localhost' &&
      (parsed.port === '8000' || (parsed.protocol === 'http:' && !parsed.port));

    if (isLegacyLocal) {
      return `${normalizedBase}/${encodeURIComponent(room)}`;
    }

    return trimmed;
  } catch {
    if (trimmed.includes('localhost:8000/')) {
      const room = trimmed.split('localhost:8000/')[1]?.split(/[?#]/)[0];
      if (room) return `${normalizedBase}/${encodeURIComponent(room)}`;
    }
    return trimmed;
  }
}
