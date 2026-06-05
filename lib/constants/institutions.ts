/**
 * Registered institutions — no CRUD UI yet; mirrors API seed list.
 * Add new entries here when onboarding more schools.
 */
export const DEFAULT_INSTITUTION = {
  name: 'Mapúa Malayan Colleges Mindanao',
  code: 'MMCM',
} as const;

export const REGISTERED_INSTITUTIONS = [DEFAULT_INSTITUTION] as const;
