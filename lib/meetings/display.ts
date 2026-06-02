import type { BadgeVariant } from '@/components/ui/Badge';

/** Meeting card typography — body text-md from md up; title one step above (xl at lg). */
export const MEETING_CARD_BODY_CLASS = 'text-sm leading-tight md:text-md';
export const MEETING_CARD_TITLE_CLASS =
  'text-md font-semibold leading-tight sm:text-lg md:text-xl';

/** Room values stored when booking face-to-face adviser meetings. */
const ADVISER_BOOKING_ROOM_LABELS: Record<string, string> = {
  room1: 'Room 1',
  room2: 'Room 2',
  room3: 'Room 3',
};

/**
 * Human-readable venue for adviser bookings (e.g. "room1" → "Room 1",
 * "Face-to-Face - room2" → "Room 2").
 */
export function formatMeetingVenueDisplay(
  location?: string | null,
  venue?: string | null,
): string {
  const raw = (venue?.trim() || location?.trim() || '');
  if (!raw) return '';

  if (/^online$/i.test(raw)) return 'Online';

  let segment = raw;
  const faceToFacePrefix = raw.match(/^face[\s-]*to[\s-]*face\s*[-–—:]\s*(.+)$/i);
  if (faceToFacePrefix) {
    segment = faceToFacePrefix[1].trim();
  }

  const normalizedKey = segment.toLowerCase().replace(/\s+/g, '');
  if (ADVISER_BOOKING_ROOM_LABELS[normalizedKey]) {
    return ADVISER_BOOKING_ROOM_LABELS[normalizedKey];
  }

  const roomNumberMatch = normalizedKey.match(/^room(\d+)$/);
  if (roomNumberMatch) {
    return `Room ${roomNumberMatch[1]}`;
  }

  return segment
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function meetingStatusBadgeVariant(status?: string | null): BadgeVariant {
  switch ((status || '').toLowerCase()) {
    case 'scheduled':
    case 'rescheduled':
      return 'primary';
    case 'pending':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

export function parseMeetingDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const parsed = new Date(String(iso).replace(/Z$/i, ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatMeetingTime(iso?: string | null): string {
  const parsed = parseMeetingDate(iso);
  if (!parsed) return '-';
  return parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMeetingDateCompact(iso?: string | null): string {
  const parsed = parseMeetingDate(iso);
  if (!parsed) return '-';
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatModalityLabel(modality?: string | null): string {
  if (!modality) return 'Not specified';
  const normalized = modality.trim().toLowerCase();
  if (normalized === 'face-to-face' || normalized === 'face to face') return 'Face to face';
  if (normalized === 'online') return 'Online';
  if (normalized === 'hybrid') return 'Hybrid';
  return modality;
}

function titleCaseDefenseType(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (normalized === 'final' || normalized === 'finals') return 'Final';
  if (!normalized) return 'Adviser';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getMeetingCardHeading(meeting: {
  meeting_title?: string | null;
  defense_type?: string | null;
}): string {
  if (meeting.meeting_title?.trim()) return meeting.meeting_title.trim();
  return `${titleCaseDefenseType(meeting.defense_type || 'adviser')} Meeting`;
}

export function getMeetingLocationLine(meeting: {
  modality?: string | null;
  location?: string | null;
  venue?: string | null;
}): string {
  const online = (meeting.modality || '').trim().toLowerCase() === 'online';
  const venueDisplay = formatMeetingVenueDisplay(meeting.location, meeting.venue);
  if (online) return formatModalityLabel(meeting.modality);
  return [formatModalityLabel(meeting.modality), venueDisplay || 'Venue not specified']
    .filter(Boolean)
    .join(' · ');
}

export function formatMeetingStatusLabel(
  status?: string | null,
  statusLabel?: string | null,
): string {
  if (statusLabel?.trim()) return statusLabel.trim();
  switch ((status || '').toLowerCase()) {
    case 'scheduled':
      return 'Scheduled';
    case 'pending':
      return 'Pending';
    case 'cancelled':
      return 'Cancelled';
    case 'completed':
      return 'Completed';
    case 'rescheduled':
      return 'Rescheduled';
    default:
      return status || 'Scheduled';
  }
}