import { del, get, post, put } from './client';
import type {
  CoordinatorRubric,
  SaveCoordinatorRubricPayload,
} from './coordinator';

export type AdviserRubric = CoordinatorRubric;

export function getAdviserRubrics() {
  return get<AdviserRubric[]>('/adviser/rubrics');
}

export function getAdviserRubric(rubricId: string) {
  return get<AdviserRubric>(`/adviser/rubrics/${rubricId}`);
}

export function createAdviserRubric(payload: SaveCoordinatorRubricPayload) {
  return post<AdviserRubric>('/adviser/rubrics', payload);
}

export function updateAdviserRubric(rubricId: string, payload: SaveCoordinatorRubricPayload) {
  return put<AdviserRubric>(`/adviser/rubrics/${rubricId}`, payload);
}

export function deleteAdviserRubric(rubricId: string) {
  return del<{ success: boolean }>(`/adviser/rubrics/${rubricId}`);
}
