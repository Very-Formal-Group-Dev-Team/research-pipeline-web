import type { BadgeVariant } from '@/components/ui/Badge';

export function statusBadgeVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (s === 'draft') return 'warning';
  if (s === 'active') return 'primary';
  if (s === 'completed' || s === 'archived') return 'success';
  return 'default';
}

/** e.g. "thesis" → "Thesis" */
export function formatProjectType(type?: string | null): string {
  if (!type) return '';
  const trimmed = type.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
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
  course?: string | null;
};

/** Program and course only — for project list card footers. */
export function buildProjectCardMetaParts(project: ProjectCardMetaSource): string[] {
  return [project.program?.trim() || '', project.course?.trim() || ''].filter(Boolean);
}

export function formatProjectCardMeta(project: ProjectCardMetaSource): string {
  return buildProjectCardMetaParts(project).join(' · ');
}
