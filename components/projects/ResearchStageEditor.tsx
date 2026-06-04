'use client';

import React, { useState } from 'react';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { FiX } from 'react-icons/fi';
import {
  formatProjectStageLabel,
  getProjectStageStepIndex,
  isProjectStageMoveBack,
  canRejectProjectAtStage,
  isProjectStageRejected,
  projectStageEmphasisTextClass,
  PROJECT_STAGE_STEPPER_ORDER,
  type ProjectStage,
  type ProjectStageStep,
} from '@/lib/utils/projectStage';

type PendingChange =
  | { kind: 'stage'; stage: ProjectStageStep }
  | { kind: 'rejected' };

type StepVisualState = 'past' | 'current' | 'future';

export interface ResearchStageEditorProps {
  currentStage: ProjectStage;
  onConfirm: (stage: ProjectStage) => Promise<boolean>;
  saving?: boolean;
  error?: string | null;
}

function stepRowState(
  index: number,
  currentIndex: number,
  isRejected: boolean,
): StepVisualState {
  if (isRejected || currentIndex < 0) return 'future';
  if (index < currentIndex) return 'past';
  if (index === currentIndex) return 'current';
  return 'future';
}

const HORIZONTAL_TRACK_ROW_CLASS = 'h-8';
const HORIZONTAL_TRACK_CENTER_CLASS = 'top-4';

function dotInnerClass(state: StepVisualState): string {
  const size = state === 'current' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5';
  const color =
    state === 'past'
      ? 'bg-success-500'
      : state === 'current'
        ? 'bg-violet-600'
        : 'border-2 border-neutral-300 bg-white';
  return `block shrink-0 rounded-full transition-transform group-hover:scale-110 ${size} ${color}`;
}

const stepDotButtonClass = `
  relative z-10 shrink-0 rounded-full
  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
  disabled:cursor-not-allowed disabled:opacity-60
`;

const horizontalStepDotButtonClass = `
  group relative z-10 flex h-8 w-8 shrink-0 items-center justify-center
  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
  disabled:cursor-not-allowed disabled:opacity-60
`;

function labelButtonClass(state: StepVisualState, horizontal: boolean): string {
  const base = `
    rounded-md transition-colors
    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
    disabled:cursor-not-allowed disabled:opacity-60
    ${horizontal ? 'text-xs leading-snug' : 'text-sm'}
  `;
  if (state === 'past') {
    return `${base} font-medium text-success-700 hover:text-success-800`;
  }
  if (state === 'current') {
    return `${base} font-medium text-violet-700 hover:text-violet-800`;
  }
  return `${base} text-neutral-500 hover:text-neutral-700`;
}

function segmentAfterClass(index: number, currentIndex: number, isRejected: boolean): string {
  const past = !isRejected && currentIndex >= 0 && index < currentIndex;
  return past ? 'bg-success-500' : 'bg-neutral-200';
}

function horizontalTrackMetrics(stepCount: number, currentIndex: number, isRejected: boolean) {
  const insetPercent = 50 / stepCount;
  const progressRatio =
    isRejected || currentIndex < 0 || stepCount <= 1
      ? 0
      : currentIndex / (stepCount - 1);
  return { insetPercent, progressRatio };
}

function openPending(
  change: PendingChange,
  setPending: (p: PendingChange) => void,
) {
  setPending(change);
}

export default function ResearchStageEditor({
  currentStage,
  onConfirm,
  saving = false,
  error = null,
}: ResearchStageEditorProps) {
  const [pending, setPending] = useState<PendingChange | null>(null);

  const isRejected = isProjectStageRejected(currentStage);
  const showRejectControl = canRejectProjectAtStage(currentStage);
  const currentIndex = isRejected ? -1 : getProjectStageStepIndex(currentStage);

  const handleConfirm = async () => {
    if (!pending) return;
    const target: ProjectStage =
      pending.kind === 'rejected' ? 'rejected' : pending.stage;
    const ok = await onConfirm(target);
    if (ok) setPending(null);
  };

  const confirmationTitle = (() => {
    if (!pending) return '';
    if (pending.kind === 'rejected') return 'Change stage?';
    if (isProjectStageMoveBack(currentStage, pending.stage)) return 'Move stage back?';
    return 'Change stage?';
  })();

  const confirmationDescription =
    pending?.kind === 'rejected' ? (
      <p className="text-sm text-neutral-600">Mark this project as rejected.</p>
    ) : pending?.kind === 'stage' ? (
      <p className="text-sm text-neutral-600">
        Set to{' '}
        <span
          className={`font-semibold ${projectStageEmphasisTextClass(pending.stage)}`}
        >
          {formatProjectStageLabel(pending.stage)}
        </span>
        .
      </p>
    ) : null;

  const pendingMatchesCurrent =
    pending?.kind === 'stage' &&
    !isRejected &&
    pending.stage === currentStage &&
    getProjectStageStepIndex(pending.stage) === currentIndex;

  const pendingIsRejectNoop = pending?.kind === 'rejected' && isRejected;

  const renderVerticalStepDot = (
    stage: ProjectStageStep,
    state: StepVisualState,
    label: string,
  ) => (
    <button
      type="button"
      disabled={saving}
      onClick={() => openPending({ kind: 'stage', stage }, setPending)}
      className={`${stepDotButtonClass} ${dotInnerClass(state)}`}
      aria-label={`Set stage to ${label}`}
      aria-current={state === 'current' ? 'step' : undefined}
    />
  );

  const renderHorizontalStepDot = (
    stage: ProjectStageStep,
    state: StepVisualState,
    label: string,
  ) => (
    <button
      type="button"
      disabled={saving}
      onClick={() => openPending({ kind: 'stage', stage }, setPending)}
      className={horizontalStepDotButtonClass}
      aria-label={`Set stage to ${label}`}
      aria-current={state === 'current' ? 'step' : undefined}
    >
      <span className={dotInnerClass(state)} aria-hidden />
    </button>
  );

  const stepCount = PROJECT_STAGE_STEPPER_ORDER.length;
  const { insetPercent, progressRatio } = horizontalTrackMetrics(
    stepCount,
    currentIndex,
    isRejected,
  );

  const renderStepLabel = (
    stage: ProjectStageStep,
    state: StepVisualState,
    label: string,
    horizontal: boolean,
  ) => (
    <button
      type="button"
      disabled={saving}
      onClick={() => openPending({ kind: 'stage', stage }, setPending)}
      className={`
        ${labelButtonClass(state, horizontal)}
        ${horizontal ? 'w-full px-0.5 text-center' : 'flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left'}
      `}
    >
      <span>{label}</span>
      {state === 'current' && !horizontal ? (
        <Badge
          variant="default"
          size="sm"
          className="shrink-0 border-violet-200 bg-violet-100 text-violet-800"
        >
          current
        </Badge>
      ) : null}
    </button>
  );

  return (
    <div className="mt-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Research stage
      </p>

      {/* Vertical stepper — small / medium screens */}
      <ol
        className="m-0 flex list-none flex-col p-0 lg:hidden"
        aria-label="Research project stages"
      >
        {PROJECT_STAGE_STEPPER_ORDER.map((stage, index) => {
          const state = stepRowState(index, currentIndex, isRejected);
          const isLast = index === PROJECT_STAGE_STEPPER_ORDER.length - 1;
          const label = formatProjectStageLabel(stage);
          const afterConnector = segmentAfterClass(index, currentIndex, isRejected);

          return (
            <li key={stage} className="flex gap-3">
              <div className="flex w-5 shrink-0 flex-col items-center">
                {renderVerticalStepDot(stage, state, label)}
                {!isLast ? (
                  <span
                    className={`mt-0.5 w-0.5 min-h-[1.75rem] flex-1 ${afterConnector}`}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="-mt-0.5 mb-5 min-w-0 flex-1">
                {renderStepLabel(stage, state, label, false)}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Horizontal stepper — large screens */}
      <ol
        className={`relative m-0 mb-6 hidden w-full list-none p-0 lg:flex lg:items-start lg:mb-12 ${HORIZONTAL_TRACK_ROW_CLASS}`}
        aria-label="Research project stages"
      >
        <div
          className={`pointer-events-none absolute ${HORIZONTAL_TRACK_CENTER_CLASS} h-0.5 -translate-y-1/2 bg-neutral-200`}
          style={{
            left: `${insetPercent}%`,
            right: `${insetPercent}%`,
          }}
          aria-hidden
        />
        {progressRatio > 0 ? (
          <div
            className={`pointer-events-none absolute ${HORIZONTAL_TRACK_CENTER_CLASS} h-0.5 -translate-y-1/2 bg-success-500`}
            style={{
              left: `${insetPercent}%`,
              width: `calc((100% - ${insetPercent * 2}%) * ${progressRatio})`,
            }}
            aria-hidden
          />
        ) : null}

        {PROJECT_STAGE_STEPPER_ORDER.map((stage, index) => {
          const state = stepRowState(index, currentIndex, isRejected);
          const label = formatProjectStageLabel(stage);

          return (
            <li
              key={stage}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div
                className={`flex w-full items-center justify-center ${HORIZONTAL_TRACK_ROW_CLASS}`}
              >
                {renderHorizontalStepDot(stage, state, label)}
              </div>
              <div className="w-full">
                {renderStepLabel(stage, state, label, true)}
              </div>
            </li>
          );
        })}
      </ol>

      {showRejectControl ? (
        <div className="mt-4 border-t border-neutral-200 pt-4 lg:mt-0">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => openPending({ kind: 'rejected' }, setPending)}
              className="inline-flex items-center gap-2 rounded-lg border border-archivumRed bg-white px-3 py-2 text-sm font-medium text-archivumRed transition-colors hover:bg-archivumRed/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-archivumRed/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiX className="text-base" aria-hidden />
              Rejected
            </button>
            <p className="text-sm text-neutral-500">
              Available only while the project is in Topic Proposal
            </p>
          </div>
        </div>
      ) : null}

      {error && !pending ? (
        <p className="mt-3 text-sm text-error-600" role="alert">
          {error}
        </p>
      ) : null}

      <Modal
        isOpen={pending !== null}
        onClose={() => {
          if (!saving) setPending(null);
        }}
        title={confirmationTitle}
        description={confirmationDescription}
        size="xs"
        panelClassName="!max-w-[18.5rem] sm:!max-w-[20.5rem]"
        titleClassName="text-xl font-semibold text-primary-700 lg:text-2xl"
        headerClassName="!border-b-0 !p-7"
        contentClassName="!p-0"
        closeOnOverlayClick={!saving}
      >
        {error && pending ? (
          <p className="mb-4 px-7 text-sm text-error-600" role="alert">
            {error}
          </p>
        ) : null}
        <ModalFooter className="!mt-0 items-center border-t border-neutral-200 !py-7 px-7">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 min-h-9 shrink-0 px-3.5 text-sm sm:h-10 sm:min-h-10 sm:px-5 sm:text-base"
            disabled={saving}
            onClick={() => setPending(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={pending?.kind === 'rejected' ? 'alert' : 'primary'}
            size="sm"
            className="h-9 min-h-9 shrink-0 px-3.5 text-sm sm:h-10 sm:min-h-10 sm:px-5 sm:text-base"
            disabled={saving || pendingMatchesCurrent || pendingIsRejectNoop}
            loading={saving}
            onClick={() => void handleConfirm()}
          >
            {pending?.kind === 'rejected' ? 'Mark rejected' : 'Confirm'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
