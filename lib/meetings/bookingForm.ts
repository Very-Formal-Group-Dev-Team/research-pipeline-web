import type { Defense } from '@/lib/api/defenses';

function parseWallClockIso(iso?: string | null) {
  if (!iso) return null;
  const parsed = new Date(iso.replace(/Z$/i, ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function defenseTypeToFormValue(defenseType?: string | null) {
  if (!defenseType) return 'Proposal';
  if (defenseType === 'final') return 'Finals';
  return defenseType.charAt(0).toUpperCase() + defenseType.slice(1);
}

export function parseMeetingLocationForForm(location?: string | null, modality?: string | null) {
  const raw = (location || '').trim();
  const mod = (modality || '').trim().toLowerCase();

  if (mod.includes('face') || /^face/i.test(raw)) {
    const roomMatch = raw.match(/^face[\s-]*to[\s-]*face\s*[-–—:]\s*(.+)$/i);
    return {
      meetingType: 'Face-to-Face',
      roomOption: (roomMatch?.[1] || '').trim().toLowerCase().replace(/\s+/g, ''),
    };
  }

  return { meetingType: 'Online', roomOption: '' };
}

export function meetingToBookingForm(meeting: Defense) {
  const start = parseWallClockIso(meeting.start_time || meeting.scheduled_at);
  const end = parseWallClockIso(meeting.end_time);
  const { meetingType, roomOption } = parseMeetingLocationForForm(meeting.location, meeting.modality);

  return {
    projectId: meeting.project_id || '',
    projectCode: meeting.project_code || '',
    projectTitle: meeting.project_title || '',
    meetingTitle: meeting.meeting_title?.trim() || '',
    date: start ? `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}` : '',
    startTime: start ? `${pad2(start.getHours())}:${pad2(start.getMinutes())}` : '',
    endTime: end ? `${pad2(end.getHours())}:${pad2(end.getMinutes())}` : '',
    meetingType,
    defenseType: defenseTypeToFormValue(meeting.defense_type),
    roomOption,
  };
}

export function buildMeetingBookingPayload(form: {
  projectId: string;
  meetingTitle: string;
  defenseType: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingType: string;
  roomOption: string;
}) {
  return {
    project_id: form.projectId,
    meeting_title: form.meetingTitle.trim(),
    defense_type: form.defenseType === 'Finals' ? 'final' : form.defenseType.toLowerCase(),
    start_time: `${form.date}T${form.startTime}:00`,
    end_time: `${form.date}T${form.endTime}:00`,
    location:
      form.meetingType === 'Face-to-Face'
        ? `Face-to-Face - ${form.roomOption}`
        : 'Online',
    modality: form.meetingType,
  };
}
