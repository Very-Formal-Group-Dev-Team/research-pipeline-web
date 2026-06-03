'use client';

import React, { useMemo, useState } from 'react';
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Avatar from '@/components/ui/Avatar';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import { FiTrash2 } from 'react-icons/fi';
import {
  removeProjectMember,
  type ProjectMember,
} from '@/lib/api/projects';

type RemovalTarget =
  | { kind: 'pending'; member: ProjectMember }
  | { kind: 'member'; member: ProjectMember };

function memberDisplayName(member: ProjectMember) {
  return member.users?.full_name || member.users?.email || 'this user';
}

function memberRoleBadgeLabel(role: string) {
  if (role === 'adviser') return 'adviser';
  if (role === 'leader') return 'leader';
  return 'collaborator';
}

export interface ProjectTeamMembersCardProps {
  projectId: string;
  members: ProjectMember[];
  pendingInvites: ProjectMember[];
  currentUserId?: string;
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
  onMembersChange,
  onInviteClick,
  inviteSuccess,
  inviteError,
}: ProjectTeamMembersCardProps) {
  const [removalTarget, setRemovalTarget] = useState<RemovalTarget | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removalError, setRemovalError] = useState<string | null>(null);

  const canManageTeam = useMemo(
    () =>
      Boolean(currentUserId) &&
      members.some(
        (member) => member.user_id === currentUserId && member.status === 'accepted',
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

  const removalName = removalTarget ? memberDisplayName(removalTarget.member) : '';
  const isRevert = removalTarget?.kind === 'pending';

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex w-full flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {members.length} {members.length === 1 ? 'member' : 'members'}
                {pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ''}
              </CardDescription>
            </div>
            <Button variant="primary" size="sm" className="shrink-0" onClick={onInviteClick}>
              Invite Members
            </Button>
          </div>
        </CardHeader>

        {(inviteSuccess || inviteError) && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              inviteSuccess ? 'bg-success-50 text-success-700' : 'bg-error-50 text-archivumRed'
            }`}
          >
            {inviteSuccess || inviteError}
          </div>
        )}

        {members.length > 0 || pendingInvites.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => {
              const showRemove =
                canManageTeam && member.role !== 'leader' && member.status === 'accepted';

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
                            ? 'success'
                            : 'default'
                      }
                      className="capitalize"
                    >
                      {memberRoleBadgeLabel(member.role)}
                    </Badge>
                    {showRemove ? (
                      <button
                        type="button"
                        onClick={() => openRemovalModal({ kind: 'member', member })}
                        className="p-2 text-neutral-400 transition-colors hover:text-archivumRed"
                        aria-label={`Remove ${memberDisplayName(member)} from team`}
                      >
                        <FiTrash2 className="text-lg" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {pendingInvites.length > 0 ? (
              <>
                <div className="pt-2 pb-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Pending invitations
                  </p>
                </div>
                {pendingInvites.map((invite) => (
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
    </>
  );
}
