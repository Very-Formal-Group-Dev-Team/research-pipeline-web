'use client';

import React, { useMemo, useState } from 'react';
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Avatar from '@/components/ui/Avatar';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { FiCheck, FiFlag, FiTrash2, FiUserPlus, FiX } from 'react-icons/fi';
import {
  removeProjectMember,
  respondToJoinRequest,
  revertMainAdviserTransfer,
  revertProjectLeadership,
  transferMainAdviser,
  transferProjectLeadership,
  type LeadershipTransferRevertPayload,
  type MainAdviserTransferRevertPayload,
  type ProjectMember,
} from '@/lib/api/projects';
import { PROJECT_TEAM_MEMBERS_SECTION_ID } from '@/lib/projects/navigation';
import { UndoActionToastHost, useUndoActionToast } from '@/components/ui/UndoActionToast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/shadcn/ui/tooltip';

type RemovalTarget =
  | { kind: 'pending'; member: ProjectMember }
  | { kind: 'member'; member: ProjectMember };

function memberDisplayName(member: ProjectMember) {
  return member.users?.full_name || member.users?.email || 'this user';
}

function memberRoleBadgeLabel(member: ProjectMember, mainAdviserUserId: string | null) {
  if (member.role === 'adviser') {
    return member.user_id === mainAdviserUserId ? 'adviser' : 'co-adviser';
  }
  if (member.role === 'leader') return 'leader';
  return 'collaborator';
}

function resolveMainAdviserUserId(members: ProjectMember[]): string | null {
  const advisers = members.filter((member) => member.role === 'adviser');
  const explicitMain = advisers.find((member) => member.is_main_adviser === true);
  if (explicitMain) return explicitMain.user_id;

  const hasExplicitFlags = advisers.some(
    (member) => member.is_main_adviser !== undefined && member.is_main_adviser !== null,
  );
  if (hasExplicitFlags) {
    return advisers.find((member) => member.is_main_adviser === true)?.user_id ?? null;
  }

  const sorted = [...advisers].sort((a, b) => {
    const aTime = a.invited_at ? new Date(a.invited_at).getTime() : 0;
    const bTime = b.invited_at ? new Date(b.invited_at).getTime() : 0;
    return aTime - bTime || a.id.localeCompare(b.id);
  });
  return sorted[0]?.user_id ?? null;
}

export interface ProjectTeamMembersCardProps {
  projectId: string;
  members: ProjectMember[];
  pendingInvites: ProjectMember[];
  currentUserId?: string;
  isProjectLeader?: boolean;
  viewerContext?: 'student' | 'adviser' | 'coordinator';
  onMembersChange: () => void;
  onInviteClick: () => void;
  inviteSuccess?: string | null;
  inviteError?: string | null;
}

export default function ProjectTeamMembersCard({
  projectId,
  members,
  pendingInvites,
  currentUserId,
  isProjectLeader = false,
  viewerContext = 'student',
  onMembersChange,
  onInviteClick,
  inviteSuccess,
  inviteError,
}: ProjectTeamMembersCardProps) {
  const [removalTarget, setRemovalTarget] = useState<RemovalTarget | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [respondingJoinRequestId, setRespondingJoinRequestId] = useState<string | null>(null);
  const [joinRequestError, setJoinRequestError] = useState<string | null>(null);
  const [leadershipTarget, setLeadershipTarget] = useState<ProjectMember | null>(null);
  const [transferringLeadership, setTransferringLeadership] = useState(false);
  const [leadershipError, setLeadershipError] = useState<string | null>(null);
  const {
    toast: leadershipUndoToast,
    showUndoToast: showLeadershipUndoToast,
    dismissUndoToast: dismissLeadershipUndoToast,
  } = useUndoActionToast();
  const [mainAdviserTarget, setMainAdviserTarget] = useState<ProjectMember | null>(null);
  const [transferringMainAdviser, setTransferringMainAdviser] = useState(false);
  const [mainAdviserError, setMainAdviserError] = useState<string | null>(null);
  const {
    toast: mainAdviserUndoToast,
    showUndoToast: showMainAdviserUndoToast,
    dismissUndoToast: dismissMainAdviserUndoToast,
  } = useUndoActionToast();

  const mainAdviserUserId = useMemo(() => resolveMainAdviserUserId(members), [members]);
  const isCurrentMainAdviser = Boolean(
    currentUserId && mainAdviserUserId && currentUserId === mainAdviserUserId,
  );

  const pendingJoinRequests = useMemo(
    () => pendingInvites.filter((invite) => invite.join_source === 'code_request'),
    [pendingInvites],
  );
  const pendingSentInvites = useMemo(
    () => pendingInvites.filter((invite) => invite.join_source !== 'code_request'),
    [pendingInvites],
  );

  const canManageTeam = useMemo(
    () =>
      Boolean(currentUserId) &&
      members.some(
        (member) => member.user_id === currentUserId && member.status === 'accepted',
      ),
    [currentUserId, members],
  );

  const isCurrentAdviser = useMemo(
    () =>
      Boolean(currentUserId) &&
      members.some(
        (member) =>
          member.user_id === currentUserId &&
          member.role === 'adviser' &&
          member.status === 'accepted',
      ),
    [currentUserId, members],
  );

  const openRemovalModal = (target: RemovalTarget) => {
    setRemovalError(null);
    setRemovalTarget(target);
  };

  const closeRemovalModal = () => {
    if (removing) return;
    setRemovalTarget(null);
    setRemovalError(null);
  };

  const handleRespondJoinRequest = async (memberId: string, accept: boolean) => {
    setRespondingJoinRequestId(memberId);
    setJoinRequestError(null);

    const res = await respondToJoinRequest(projectId, memberId, accept);
    if (res.error) {
      setJoinRequestError(res.error);
      setRespondingJoinRequestId(null);
      return;
    }

    setRespondingJoinRequestId(null);
    onMembersChange();
  };

  const handleConfirmRemoval = async () => {
    if (!removalTarget) return;
    setRemoving(true);
    setRemovalError(null);

    const res = await removeProjectMember(projectId, removalTarget.member.id);
    if (res.error) {
      setRemovalError(res.error);
      setRemoving(false);
      return;
    }

    setRemovalTarget(null);
    setRemoving(false);
    onMembersChange();
  };

  const openLeadershipModal = (member: ProjectMember) => {
    setLeadershipError(null);
    setLeadershipTarget(member);
  };

  const closeLeadershipModal = () => {
    if (transferringLeadership) return;
    setLeadershipTarget(null);
    setLeadershipError(null);
  };

  const handleRevertLeadership = async (revertPayload: LeadershipTransferRevertPayload) => {
    const res = await revertProjectLeadership(projectId, revertPayload);
    if (res.error) {
      setLeadershipError(res.error);
      return;
    }
    dismissLeadershipUndoToast();
    onMembersChange();
  };

  const handleConfirmLeadershipTransfer = async () => {
    if (!leadershipTarget) return;
    setTransferringLeadership(true);
    setLeadershipError(null);

    const targetName = memberDisplayName(leadershipTarget);
    const res = await transferProjectLeadership(projectId, leadershipTarget.id);
    if (res.error || !res.data?.success || !res.data.revert) {
      setLeadershipError(res.error || 'Failed to transfer leadership');
      setTransferringLeadership(false);
      return;
    }

    const revertPayload = res.data.revert;
    setLeadershipTarget(null);
    setTransferringLeadership(false);
    onMembersChange();

    showLeadershipUndoToast({
      message: `Leadership transferred to ${targetName}.`,
      onUndo: () => handleRevertLeadership(revertPayload),
    });
  };

  const openMainAdviserModal = (member: ProjectMember) => {
    setMainAdviserError(null);
    setMainAdviserTarget(member);
  };

  const closeMainAdviserModal = () => {
    if (transferringMainAdviser) return;
    setMainAdviserTarget(null);
    setMainAdviserError(null);
  };

  const handleRevertMainAdviser = async (revertPayload: MainAdviserTransferRevertPayload) => {
    const res = await revertMainAdviserTransfer(projectId, revertPayload);
    if (res.error) {
      setMainAdviserError(res.error);
      return;
    }
    dismissMainAdviserUndoToast();
    onMembersChange();
  };

  const handleConfirmMainAdviserTransfer = async () => {
    if (!mainAdviserTarget) return;
    setTransferringMainAdviser(true);
    setMainAdviserError(null);

    const targetName = memberDisplayName(mainAdviserTarget);
    const res = await transferMainAdviser(projectId, mainAdviserTarget.id);
    if (res.error || !res.data?.success || !res.data.revert) {
      setMainAdviserError(res.error || 'Failed to transfer main adviser role');
      setTransferringMainAdviser(false);
      return;
    }

    const revertPayload = res.data.revert;
    setMainAdviserTarget(null);
    setTransferringMainAdviser(false);
    onMembersChange();

    showMainAdviserUndoToast({
      message: `Main adviser role transferred to ${targetName}.`,
      onUndo: () => handleRevertMainAdviser(revertPayload),
    });
  };

  const removalName = removalTarget ? memberDisplayName(removalTarget.member) : '';
  const leadershipTargetName = leadershipTarget ? memberDisplayName(leadershipTarget) : '';
  const mainAdviserTargetName = mainAdviserTarget ? memberDisplayName(mainAdviserTarget) : '';
  const isRevert = removalTarget?.kind === 'pending';

  return (
    <>
      <Card id={PROJECT_TEAM_MEMBERS_SECTION_ID} className="h-full scroll-mt-24">
        <CardHeader>
          <div className="flex w-full flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {members.length} {members.length === 1 ? 'member' : 'members'}
                {pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ''}
              </CardDescription>
            </div>
            {viewerContext !== 'coordinator' ? (
            <Button
              variant="primary"
              size="sm"
              className="shrink-0"
              leftIcon={<FiUserPlus className="h-4 w-4" aria-hidden />}
              onClick={onInviteClick}
            >
              Invite Members
            </Button>
            ) : null}
          </div>
        </CardHeader>

        {(inviteSuccess || inviteError || joinRequestError) && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              inviteSuccess && !inviteError && !joinRequestError
                ? 'bg-success-50 text-success-700'
                : 'bg-error-50 text-archivumRed'
            }`}
          >
            {inviteSuccess || inviteError || joinRequestError}
          </div>
        )}

        {members.length > 0 || pendingInvites.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => {
              const showRemove =
                isCurrentAdviser && member.role === 'member' && member.status === 'accepted';
              const showMakeLeader =
                viewerContext === 'student' &&
                isProjectLeader &&
                member.role === 'member' &&
                member.status === 'accepted' &&
                member.user_id !== currentUserId;
              const showMakeMainAdviser =
                viewerContext === 'adviser' &&
                isCurrentMainAdviser &&
                member.role === 'adviser' &&
                member.status === 'accepted' &&
                member.user_id !== currentUserId;
              const isMainAdviser =
                member.role === 'adviser' && member.user_id === mainAdviserUserId;

              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${
                    member.role === 'leader'
                      ? 'border-primary-300 bg-primary-50/50'
                      : member.role === 'adviser'
                        ? 'border-neutral-200 bg-neutral-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <Avatar
                    src={member.users?.avatar_url}
                    name={member.users?.full_name || member.users?.email || 'Unknown'}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-neutral-900 truncate">
                        {member.users?.full_name || 'Unknown User'}
                      </h4>
                      {member.role === 'leader' ? (
                        <span className="text-xs font-medium text-primary-600 whitespace-nowrap">
                          (Leader)
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-600 break-all">{member.users?.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant={
                        member.role === 'leader'
                          ? 'primary'
                          : member.role === 'adviser'
                            ? isMainAdviser
                              ? 'success'
                              : 'default'
                            : 'default'
                      }
                      className="capitalize"
                    >
                      {memberRoleBadgeLabel(member, mainAdviserUserId)}
                    </Badge>
                    {showMakeLeader || showMakeMainAdviser || showRemove ? (
                      <div className="-space-x-0.5 flex items-center">
                        {showMakeMainAdviser ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => openMainAdviserModal(member)}
                                className="p-2 text-neutral-400 transition-colors hover:text-primary-600"
                                aria-label={`Appoint ${memberDisplayName(member)} as main adviser`}
                              >
                                <FiFlag className="text-lg" aria-hidden />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Appoint this member as main adviser</TooltipContent>
                          </Tooltip>
                        ) : null}
                        {showMakeLeader ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => openLeadershipModal(member)}
                                className="p-2 text-neutral-400 transition-colors hover:text-primary-600"
                                aria-label={`Appoint ${memberDisplayName(member)} as leader`}
                              >
                                <FiFlag className="text-lg" aria-hidden />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Appoint this member as leader</TooltipContent>
                          </Tooltip>
                        ) : null}
                        {showRemove ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => openRemovalModal({ kind: 'member', member })}
                                className="p-2 text-neutral-400 transition-colors hover:text-archivumRed"
                                aria-label={`Remove ${memberDisplayName(member)} from team`}
                              >
                                <FiTrash2 className="text-lg" aria-hidden />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Remove this member from the project</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {pendingJoinRequests.length > 0 ? (
              <>
                <div className="pt-2 pb-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Pending join requests
                  </p>
                </div>
                {pendingJoinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-4 rounded-lg border border-warning-200 bg-warning-50/40 p-3"
                  >
                    <Avatar
                      src={request.users?.avatar_url}
                      name={request.users?.full_name || request.users?.email || 'Unknown'}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-neutral-800 truncate">
                        {request.users?.full_name || 'Unknown User'}
                      </h4>
                      <p className="mt-0.5 text-sm text-neutral-600 break-all">{request.users?.email}</p>
                      <p className="mt-1 text-xs text-neutral-500">Requested via project code</p>
                    </div>
                    {isProjectLeader ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRespondJoinRequest(request.id, true)}
                          disabled={respondingJoinRequestId === request.id}
                          loading={respondingJoinRequestId === request.id}
                          leftIcon={<FiCheck className="h-4 w-4" aria-hidden />}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRespondJoinRequest(request.id, false)}
                          disabled={respondingJoinRequestId === request.id}
                          leftIcon={<FiX className="h-4 w-4" aria-hidden />}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </>
            ) : null}

            {pendingSentInvites.length > 0 ? (
              <>
                <div className="pt-2 pb-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Pending invitations
                  </p>
                </div>
                {pendingSentInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                  >
                    <Avatar
                      src={invite.users?.avatar_url}
                      name={invite.users?.full_name || invite.users?.email || 'Unknown'}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-neutral-800 truncate">
                        {invite.users?.full_name || 'Unknown User'}
                      </h4>
                      <p className="mt-0.5 text-sm text-neutral-600 break-all">{invite.users?.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant={invite.role === 'adviser' ? 'success' : 'default'}
                        className="capitalize shrink-0"
                      >
                        {invite.role}
                      </Badge>
                      {canManageTeam ? (
                        <button
                          type="button"
                          onClick={() => openRemovalModal({ kind: 'pending', member: invite })}
                          className="p-2 text-neutral-400 transition-colors hover:text-archivumRed"
                          aria-label={`Revert invitation for ${memberDisplayName(invite)}`}
                        >
                          <FiTrash2 className="text-lg" aria-hidden />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-neutral-500">
            No team members yet. Use Invite Members to add collaborators or advisers.
          </p>
        )}
      </Card>

      <Modal
        isOpen={Boolean(mainAdviserTarget)}
        onClose={closeMainAdviserModal}
        title="Transfer main adviser role?"
        size="sm"
        closeOnOverlayClick={!transferringMainAdviser}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">
            Make <span className="font-semibold text-neutral-900">{mainAdviserTargetName}</span> the
            main adviser for this project? You will become a co-adviser and they will take over main
            adviser permissions.
          </p>
          {mainAdviserError ? <p className="text-sm text-archivumRed">{mainAdviserError}</p> : null}
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={closeMainAdviserModal}
            disabled={transferringMainAdviser}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleConfirmMainAdviserTransfer()}
            disabled={transferringMainAdviser}
            loading={transferringMainAdviser}
          >
            Make main adviser
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={Boolean(leadershipTarget)}
        onClose={closeLeadershipModal}
        title="Transfer project leadership?"
        size="sm"
        closeOnOverlayClick={!transferringLeadership}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">
            Make <span className="font-semibold text-neutral-900">{leadershipTargetName}</span> the
            new project leader? You will become a regular team member and they will gain full
            leadership permissions.
          </p>
          {leadershipError ? <p className="text-sm text-archivumRed">{leadershipError}</p> : null}
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={closeLeadershipModal}
            disabled={transferringLeadership}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleConfirmLeadershipTransfer()}
            disabled={transferringLeadership}
            loading={transferringLeadership}
          >
            Make leader
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={Boolean(removalTarget)}
        onClose={closeRemovalModal}
        title={isRevert ? 'Revert invitation?' : 'Remove team member?'}
        size="sm"
        closeOnOverlayClick={!removing}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">
            {isRevert ? (
              <>
                Are you sure you want to revert the invitation for{' '}
                <span className="font-semibold text-neutral-900">{removalName}</span>? They will no
                longer see this project invitation.
              </>
            ) : (
              <>
                Are you sure you want to remove{' '}
                <span className="font-semibold text-neutral-900">{removalName}</span> from the team?
                They will lose access to this project.
              </>
            )}
          </p>
          {removalError ? <p className="text-sm text-archivumRed">{removalError}</p> : null}
        </div>
        <ModalFooter>
          <Button variant="outline" size="sm" onClick={closeRemovalModal} disabled={removing}>
            Cancel
          </Button>
          <Button
            variant="error"
            size="sm"
            onClick={handleConfirmRemoval}
            disabled={removing}
            loading={removing}
          >
            {isRevert ? 'Revert invitation' : 'Remove member'}
          </Button>
        </ModalFooter>
      </Modal>

      <UndoActionToastHost
        toast={leadershipUndoToast}
        onDismiss={dismissLeadershipUndoToast}
      />
      <UndoActionToastHost
        toast={mainAdviserUndoToast}
        onDismiss={dismissMainAdviserUndoToast}
      />
    </>
  );
}
