import type { Defense } from '@/lib/api/defenses';
import type { InstitutionEvent, UpdateInstitutionEventPayload } from '@/lib/api/events';

export interface InstitutionEventFormState {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  modality: 'Online' | 'In-Person' | 'Hybrid';
}

export function institutionEventToMeetingCard(event: InstitutionEvent): Defense {
  return {
    id: event.id,
    project_id: '',
    project_title: '',
    project_code: '',
    defense_type: 'proposal',
    meeting_title: event.title,
    start_time: event.start_time,
    end_time: event.end_time,
    location: event.location,
    modality: event.modality,
    status: event.status,
    created_by: event.created_by,
    created_by_name: event.created_by_name,
    scheduled_at: event.start_time,
    created_at: event.created_at,
  };
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function institutionEventToFormState(event: InstitutionEvent): InstitutionEventFormState {
  const start = new Date(String(event.start_time).replace(/Z$/i, ''));
  const end = new Date(String(event.end_time).replace(/Z$/i, ''));

  return {
    title: event.title,
    description: event.description || '',
    date: Number.isNaN(start.getTime())
      ? ''
      : `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`,
    startTime: Number.isNaN(start.getTime()) ? '' : `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
    endTime: Number.isNaN(end.getTime()) ? '' : `${pad2(end.getHours())}:${pad2(end.getMinutes())}`,
    location: event.location,
    modality: event.modality,
  };
}

export function institutionEventFormToPayload(
  form: InstitutionEventFormState,
): UpdateInstitutionEventPayload {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    start_time: `${form.date}T${form.startTime}:00`,
    end_time: `${form.date}T${form.endTime}:00`,
    location: form.location.trim(),
    modality: form.modality,
  };
}
