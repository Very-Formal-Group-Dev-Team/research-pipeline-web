'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Button from '@/components/Button';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { leaveProject, type ProjectMember } from '@/lib/api/projects';

export type LeaveProjectRole = 'member' | 'adviser' | 'leader';

interface LeaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  leaveRole: LeaveProjectRole;
  displayName: string;
  successorCandidates: ProjectMember[];
  onLeft: (result: { action: string; removed?: boolean }) => void;
}

export default function LeaveProjectModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  leaveRole,
  displayName,
  successorCandidates,
  onLeft,
}: LeaveProjectModalProps) {
  const [reason, setReason] = useState('');
  const [leaderStep, setLeaderStep] = useState<1 | 2>(1);
  const [successorMemberId, setSuccessorMemberId] = useState('');
  const [confirmDisplayName, setConfirmDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successorOptions = useMemo(
    () =>
      successorCandidates.map((member) => ({
        value: member.id,
        label: member.users?.full_name || member.users?.email || 'Member',
      })),
    [successorCandidates],
  );

  const displayNameMatches = confirmDisplayName === displayName;

  useEffect(() => {
    if (!isOpen) return;
    setReason('');
    setLeaderStep(1);
    setSuccessorMemberId('');
    setConfirmDisplayName('');
    setSubmitting(false);
    setError(null);
  }, [isOpen, leaveRole]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const payload =
      leaveRole === 'leader'
        ? { successorMemberId, confirmDisplayName }
        : leaveRole === 'adviser'
          ? { reason: reason.trim() || undefined }
          : {};

    const res = await leaveProject(projectId, payload);
    if (res.error || !res.data?.success) {
      setError(res.error || 'Failed to leave project');
      setSubmitting(false);
      return;
    }

    onLeft({ action: res.data.action, removed: res.data.removed });
    setSubmitting(false);
  };

  const leaderCanProceedStep1 = Boolean(successorMemberId);
  const leaderCanConfirm = displayNameMatches;

  const title =
    leaveRole === 'leader' ? 'Transfer project ownership' : 'Leave this project?';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
      closeOnOverlayClick={!submitting}
    >
      {leaveRole === 'member' ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">
            You are about to leave{' '}
            <span className="font-semibold text-neutral-900">{projectTitle}</span>. You will lose
            access to project files and discussions. This cannot be undone.
          </p>
          {error ? <p className="text-sm text-archivumRed">{error}</p> : null}
        </div>
      ) : null}

      {leaveRole === 'adviser' ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">
            You are about to leave{' '}
            <span className="font-semibold text-neutral-900">{projectTitle}</span> as adviser. The
            project will continue without an assigned adviser, and remaining members will be
            notified.
          </p>
          <div>
            <label htmlFor="leave-reason" className="mb-1 block text-sm font-medium text-neutral-800">
              Reason for leaving <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <textarea
              id="leave-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={submitting}
              placeholder="Share why you are stepping down as adviser"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary-400/60 disabled:opacity-60"
            />
          </div>
          {error ? <p className="text-sm text-archivumRed">{error}</p> : null}
        </div>
      ) : null}

      {leaveRole === 'leader' ? (
        <div className="space-y-4">
          {leaderStep === 1 ? (
            <>
              <p className="text-sm text-neutral-700">
                Before leaving your role as project owner, choose a successor from the current team.
                Ownership will transfer to them and you will become a regular member.
              </p>
              <Select
                label="New project owner"
                value={successorMemberId}
                onChange={(e) => setSuccessorMemberId(e.target.value)}
                options={successorOptions}
                placeholder="Select a team member"
                required
                fullWidth
                disabled={submitting}
                responsiveText
              />
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-700">
                To confirm the ownership transfer for{' '}
                <span className="font-semibold text-neutral-900">{projectTitle}</span>, type your
                display name exactly as shown below (case-sensitive):
              </p>
              <p className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-900 break-all">
                {displayName}
              </p>
              <Input
                label="Your display name"
                value={confirmDisplayName}
                onChange={(e) => setConfirmDisplayName(e.target.value)}
                placeholder={displayName}
                autoComplete="off"
                disabled={submitting}
                responsiveText
              />
            </>
          )}
          {error ? <p className="text-sm text-archivumRed">{error}</p> : null}
        </div>
      ) : null}

      <ModalFooter>
        {leaveRole === 'leader' && leaderStep === 2 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLeaderStep(1);
              setError(null);
            }}
            disabled={submitting}
          >
            Back
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
        )}

        {leaveRole === 'leader' ? (
          leaderStep === 1 ? (
            <Button
              variant="error"
              size="sm"
              onClick={() => {
                setLeaderStep(2);
                setError(null);
              }}
              disabled={!leaderCanProceedStep1 || submitting}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="error"
              size="sm"
              onClick={() => void handleConfirm()}
              disabled={!leaderCanConfirm || submitting}
              loading={submitting}
            >
              Leave project
            </Button>
          )
        ) : (
          <Button
            variant="error"
            size="sm"
            onClick={() => void handleConfirm()}
            disabled={submitting}
            loading={submitting}
          >
            Leave project
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
