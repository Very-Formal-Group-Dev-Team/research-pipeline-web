/**
 * Coordinator institution events API.
 */

import { get, post, patch } from './client';

export interface InstitutionEvent {
  id: string;
  institution_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string;
  modality: 'Online' | 'In-Person' | 'Hybrid';
  status: 'scheduled' | 'cancelled' | 'completed';
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInstitutionEventPayload {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location: string;
  modality?: 'Online' | 'In-Person' | 'Hybrid';
}

export type UpdateInstitutionEventPayload = CreateInstitutionEventPayload;

export function getCoordinatorEvents() {
  return get<InstitutionEvent[]>('/coordinator/events');
}

export function createCoordinatorEvent(payload: CreateInstitutionEventPayload) {
  return post<InstitutionEvent>('/coordinator/events', payload);
}

export function updateCoordinatorEvent(eventId: string, payload: UpdateInstitutionEventPayload) {
  return patch<InstitutionEvent>(`/coordinator/events/${eventId}`, payload);
}

export function completeCoordinatorEvent(eventId: string) {
  return patch<InstitutionEvent>(`/coordinator/events/${eventId}/complete`, {});
}

export function cancelCoordinatorEvent(eventId: string) {
  return patch<InstitutionEvent>(`/coordinator/events/${eventId}/cancel`, {});
}

export function revertCoordinatorEvent(eventId: string) {
  return patch<InstitutionEvent>(`/coordinator/events/${eventId}/revert`, {});
}
