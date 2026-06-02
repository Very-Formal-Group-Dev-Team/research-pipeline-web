import type { BadgeVariant } from '@/components/ui/Badge';

/** Room values stored when booking face-to-face adviser meetings. */const ADVISER_BOOKING_ROOM_LABELS: Record<string, string> = {
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