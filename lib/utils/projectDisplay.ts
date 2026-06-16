import type { BadgeVariant } from '@/components/ui/Badge';
import { projectStageBadgeVariant } from '@/lib/utils/projectStage';

/** Badge color for project research stage (status). */
export function statusBadgeVariant(status: string): BadgeVariant {
  return projectStageBadgeVariant(status);
}

/** e.g. "thesis" → "Thesis" */
export function formatProjectType(type?: string | null): string {
  if (!type) return '';
  const trimmed = type.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export const PAPER_STANDARD_FORM_OPTIONS = [
  { value: 'IMRAD', label: 'IMRAD' },
  { value: 'IEEE', label: 'IEEE' },
  { value: 'custom', label: 'Custom' },
] as const;

export const PROJECT_TYPE_FORM_OPTIONS = [
  { value: 'thesis', label: 'Thesis' },
  { value: 'capstone', label: 'Capstone' },
] as const;

/** Map stored paper_standard to create-form select values. */
export function paperStandardFormValue(standard?: string | null): string {
  const lower = (standard || 'ieee').trim().toLowerCase();
  if (lower === 'imrad') return 'IMRAD';
  if (lower === 'ieee') return 'IEEE';
  if (lower === 'custom') return 'custom';
  return 'IEEE';
}

/** IMRAD/IEEE uppercase; Custom title case; other values first letter only */
export function formatPaperStandard(standard?: string | null): string {
  if (!standard) return '';
  const trimmed = standard.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (lower === 'imrad' || lower === 'ieee') return lower.toUpperCase();
  if (lower === 'custom') return 'Custom';
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function formatProjectCardDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type ProjectCardMetaSource = {
  program?: string | null;
  course_code?: string | null;
};

/** Program and course code only — for project list card footers. */
export function buildProjectCardMetaParts(project: ProjectCardMetaSource): string[] {
  return [project.program?.trim() || '', project.course_code?.trim() || ''].filter(Boolean);
}

export function formatProjectCardMeta(project: ProjectCardMetaSource): string {
  return buildProjectCardMetaParts(project).join(' · ');
}
