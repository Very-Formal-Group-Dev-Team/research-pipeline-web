import type { BadgeVariant } from '@/components/ui/Badge';
import { formatStatusLabel } from '@/lib/utils/formatStatus';

/** Linear lifecycle order (rejected is outside the stepper). */
export const PROJECT_STAGE_STEPPER_ORDER = [
  'topic_proposal',
  'approved',
  'ongoing',
  'for_pre_defense',
  'for_final_defense',
  'completed',
  'for_publication',
] as const;

export type ProjectStageStep = (typeof PROJECT_STAGE_STEPPER_ORDER)[number];

export const PROJECT_STAGE_VALUES = [
  ...PROJECT_STAGE_STEPPER_ORDER,
  'rejected',
] as const;

export type ProjectStage = (typeof PROJECT_STAGE_VALUES)[number];

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  topic_proposal: 'Topic Proposal',
  approved: 'Approved',
  ongoing: 'Ongoing',
  for_pre_defense: 'For Pre-Defense',
  for_final_defense: 'For Final Defense',
  completed: 'Completed',
  for_publication: 'For Publication',
  rejected: 'Rejected',
};

const LEGACY_STAGE_MAP: Record<string, ProjectStage> = {
  draft: 'topic_proposal',
  active: 'ongoing',
  archived: 'completed',
};

/** Normalize API/legacy status strings to a known stage value when possible. */
export function normalizeProjectStage(status?: string | null): string {
  const raw = String(status || 'topic_proposal')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (LEGACY_STAGE_MAP[raw]) return LEGACY_STAGE_MAP[raw];
  if ((PROJECT_STAGE_VALUES as readonly string[]).includes(raw)) return raw;
  return raw;
}

export function formatProjectStageLabel(status?: string | null): string {
  const normalized = normalizeProjectStage(status);
  if ((PROJECT_STAGE_VALUES as readonly string[]).includes(normalized)) {
    return PROJECT_STAGE_LABELS[normalized as ProjectStage];
  }
  return formatStatusLabel(status);
}

/** Dark text color matching each stage badge, for emphasis in confirmations. */
export function projectStageEmphasisTextClass(status?: string | null): string {
  const stage = normalizeProjectStage(status);
  switch (stage) {
    case 'topic_proposal':
      return 'text-neutral-800';
    case 'approved':
      return 'text-success-800';
    case 'ongoing':
      return 'text-primary-800';
    case 'for_pre_defense':
      return 'text-warning-900';
    case 'for_final_defense':
      return 'text-error-800';
    case 'completed':
      return 'text-emerald-900';
    case 'for_publication':
      return 'text-accent-900';
    case 'rejected':
      return 'text-rose-950';
    default:
      return 'text-neutral-800';
  }
}

/** One distinct badge variant per research stage. */
export function projectStageBadgeVariant(status?: string | null): BadgeVariant {
  const stage = normalizeProjectStage(status);
  switch (stage) {
    case 'topic_proposal':
      return 'stage-topic-proposal';
    case 'approved':
      return 'stage-approved';
    case 'ongoing':
      return 'stage-ongoing';
    case 'for_pre_defense':
      return 'stage-pre-defense';
    case 'for_final_defense':
      return 'stage-final-defense';
    case 'completed':
      return 'stage-completed';
    case 'for_publication':
      return 'stage-publication';
    case 'rejected':
      return 'stage-rejected';
    default:
      return 'default';
  }
}

export const PROJECT_STAGE_FORM_OPTIONS = PROJECT_STAGE_VALUES.map((value) => ({
  value,
  label: PROJECT_STAGE_LABELS[value],
}));

export function isProjectStageComplete(status?: string | null): boolean {
  const stage = normalizeProjectStage(status);
  return stage === 'completed' || stage === 'for_publication';
}

/** True when the project is archived or in a terminal stage and cannot be left. */
export function isProjectLocked(status?: string | null): boolean {
  const raw = String(status || '')
    .trim()
    .toLowerCase();
  if (raw === 'archived') return true;
  const stage = normalizeProjectStage(status);
  return stage === 'completed' || stage === 'for_publication';
}

export function isProjectStageRejected(status?: string | null): boolean {
  return normalizeProjectStage(status) === 'rejected';
}

export function isProjectStageTopicProposal(status?: string | null): boolean {
  return normalizeProjectStage(status) === 'topic_proposal';
}

/** Rejection is allowed at any stage except when already rejected. */
export function canRejectProjectAtStage(status?: string | null): boolean {
  return !isProjectStageRejected(status);
}

export function getProjectStageStepIndex(stage: string): number {
  const normalized = normalizeProjectStage(stage);
  return (PROJECT_STAGE_STEPPER_ORDER as readonly string[]).indexOf(normalized);
}

/** True when moving to an earlier step in the linear lifecycle. */
export function isProjectStageMoveBack(
  fromStage: string,
  toStage: string,
): boolean {
  if (isProjectStageRejected(fromStage)) return false;
  const fromIdx = getProjectStageStepIndex(fromStage);
  const toIdx = getProjectStageStepIndex(toStage);
  if (fromIdx < 0 || toIdx < 0) return false;
  return toIdx < fromIdx;
}
