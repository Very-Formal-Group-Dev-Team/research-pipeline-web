'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/Button';
import DefenseBatchPlanner from '@/components/coordinator/DefenseBatchPlanner';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  confirmUnsavedLeave,
  useUnsavedChangesWarning,
} from '@/lib/hooks/useUnsavedChangesWarning';
import {
  bookDefenseSchedule,
  getCoordinatorRubrics,
  getCourseGroups,
  getInstitutionPanelists,
  verifyDefense,
  type CoordinatorRubric,
  type CourseGroup,
  type InstitutionAdviser,
} from '@/lib/api/coordinator';
import type { BatchLane } from '@/lib/coordinator/defenseBatchPlanner';
import {
  getBatchDisplayName,
  isAssignableLane,
  validateLaneSlotAssignments,
  validateManualLanes,
} from '@/lib/coordinator/defenseBatchPlanner';
import type { DefenseBatchPlannerDraft } from '@/lib/coordinator/defenseBatchSession';
import {
  clearDefenseBatchSession,
  loadDefenseBatchSession,
  type DefenseBatchSession,
} from '@/lib/coordinator/defenseBatchSession';

function buildVerifyPayload(draft: DefenseBatchPlannerDraft, lane: BatchLane) {
  return {
    location: draft.location.trim(),
    venue: draft.venue.trim() || undefined,
    modality: draft.modality,
    verifiedSchedule: `${draft.date}T${lane.startTime}:00`,
    verifiedEndTime: `${draft.date}T${lane.endTime}:00`,
    defenseType: draft.defenseType,
    rubricId: draft.rubricId || undefined,
    panelistIds: draft.panelistIds.length ? draft.panelistIds : [],
  };
}

export default function CoordinatorDefenseEditPage() {
  const router = useRouter();
  const { user, handleLogout } = useDashboardUser('Coordinator');

  const [session, setSession] = useState<DefenseBatchSession | null>(null);
  const [draft, setDraft] = useState<DefenseBatchPlannerDraft | null>(null);
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [rubrics, setRubrics] = useState<CoordinatorRubric[]>([]);
  const [panelistPool, setPanelistPool] = useState<InstitutionAdviser[]>([]);
  const [courseGroupsLoading, setCourseGroupsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [plannerDirty, setPlannerDirty] = useState(false);

  const eventsListPath = '/coordinator/events?tab=approved';

  const isDraftDirty = useMemo(() => {
    if (!session || !draft) return false;
    return JSON.stringify(draft) !== JSON.stringify(session.draft);
  }, [draft, session]);

  const isDirty = isDraftDirty || plannerDirty;

  useUnsavedChangesWarning(isDirty);

  const handleLeave = useCallback(() => {
    if (!isDirty || confirmUnsavedLeave()) {
      router.push(eventsListPath);
    }
  }, [isDirty, router, eventsListPath]);

  useEffect(() => {
    const stored = loadDefenseBatchSession();
    if (!stored) {
      router.replace('/coordinator/events');
      return;
    }

    setSession(stored);
    setDraft(stored.draft);
    setCourseGroups(stored.courseGroups);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!session?.draft.courseId) return;

    let cancelled = false;
    setCourseGroupsLoading(true);

    void Promise.all([
      getCourseGroups(session.draft.courseId),
      getCoordinatorRubrics(),
      getInstitutionPanelists(),
    ]).then(([groupsRes, rubricsRes, panelistsRes]) => {
      if (cancelled) return;
      if (groupsRes.data) setCourseGroups(groupsRes.data);
      if (rubricsRes.data) setRubrics(rubricsRes.data);
      if (panelistsRes.data) setPanelistPool(panelistsRes.data);
      setCourseGroupsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [session?.draft.courseId]);

  async function handleSaveBatchAssignments(lanes: BatchLane[]) {
    if (!session || !draft) return;

    const { defenseIdsByProjectId = {} } = session;
    setError(null);
    setSubmitting(true);

    const lanesWithGroups = lanes.filter(
      (lane) => lane.groupIds.length > 0 && isAssignableLane(lane),
    );
    if (!lanesWithGroups.length) {
      setSubmitting(false);
      setError('Assign at least one group to a defense batch before saving.');
      return;
    }

    const laneValidation = validateManualLanes(lanes, draft.startTime, draft.endTime);
    if (!laneValidation.valid) {
      setSubmitting(false);
      setError(laneValidation.errors[0]);
      return;
    }

    const slotValidation = validateLaneSlotAssignments(lanes);
    if (!slotValidation.valid) {
      setSubmitting(false);
      setError(slotValidation.errors[0]);
      return;
    }

    const assignments: Array<{ groupId: string; lane: BatchLane }> = [];
    for (const lane of lanesWithGroups) {
      for (const groupId of lane.groupIds) {
        assignments.push({ groupId, lane });
      }
    }

    for (const { groupId, lane } of assignments) {
      const existingDefenseId = defenseIdsByProjectId[groupId];
      const verifyPayload = buildVerifyPayload(draft, lane);

      const res = existingDefenseId
        ? await verifyDefense(existingDefenseId, verifyPayload)
        : await bookDefenseSchedule({
            courseId: draft.courseId,
            rubricId: draft.rubricId || undefined,
            defenseType: draft.defenseType,
            date: draft.date,
            startTime: lane.startTime,
            endTime: lane.endTime,
            location: draft.location.trim(),
            venue: draft.venue.trim() || undefined,
            modality: draft.modality,
            panelistIds: draft.panelistIds.length ? draft.panelistIds : undefined,
            projectIds: [groupId],
          });

      if (res.error) {
        setSubmitting(false);
        setError(res.error);
        return;
      }

      if (res.data && 'conflict' in res.data && res.data.conflict) {
        const count = res.data.conflicts?.length ?? 0;
        const domains = [...new Set((res.data.conflicts || []).map((c) => c.domain))].join(', ');
        setSubmitting(false);
        setError(
          count
            ? `${getBatchDisplayName(lane)} conflict (${count} overlap${count === 1 ? '' : 's'}${domains ? `: ${domains}` : ''}). Adjust assignments or times.`
            : `${getBatchDisplayName(lane)} has a schedule conflict. Adjust assignments or times.`,
        );
        return;
      }
    }

    setSubmitting(false);
    clearDefenseBatchSession();
    router.push(eventsListPath);
  }

  if (!ready || !session || !draft) {
    return (
      <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
        <div className="flex min-h-[16rem] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 coordinator-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  const isEditMode = session.mode === 'edit';

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold coordinator-heading">
              {isEditMode ? 'Edit Defense' : 'Assign Defense Batches'}
            </h1>
            <p className="coordinator-text-muted mt-1">
              {isEditMode
                ? `Update defense details and batch assignments for ${draft.courseName}.`
                : `Divide groups into batches and assign time slots for ${draft.courseName}.`}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 self-start sm:self-center text-primary-700 hover:bg-primary-50"
            leftIcon={<FiArrowLeft className="h-4 w-4" aria-hidden />}
            onClick={handleLeave}
          >
            Back to Events
          </Button>
        </div>

        <DefenseBatchPlanner
          draft={draft}
          onDraftChange={setDraft}
          rubrics={rubrics}
          panelistPool={panelistPool}
          initialGroups={session.eventGroups}
          availableGroups={courseGroups}
          initialLaneAssignments={session.initialLaneAssignments}
          loadingAvailableGroups={courseGroupsLoading}
          submitting={submitting}
          error={error}
          onDirtyChange={setPlannerDirty}
          onBack={handleLeave}
          onSave={handleSaveBatchAssignments}
        />
      </div>
    </DashboardLayout>
  );
}
