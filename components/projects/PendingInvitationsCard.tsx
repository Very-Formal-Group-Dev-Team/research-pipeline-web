'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FiCheck, FiMail, FiX } from 'react-icons/fi';

import Button from '@/components/Button';
import Card from '@/components/ui/Card';
import CardIconHeader from '@/components/ui/CardIconHeader';
import {
  getMyInvitations,
  respondToInvitation,
  type Invitation,
} from '@/lib/api/projects';

export const PROJECT_INVITATION_RESPONDED_EVENT = 'srp:project-invitation-responded';

export type ProjectInvitationRespondedDetail = {
  accept: boolean;
  projectId: string;
  invitationId: string;
};

function formatInvitationRole(role: string, contributorRole?: string | null) {
  if (contributorRole?.trim()) return contributorRole.trim();
  if (!role) return 'Member';
  if (role === 'member') return 'Collaborator';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export interface PendingInvitationsCardProps {
  onInvitationResponded?: (detail: ProjectInvitationRespondedDetail) => void;
  emptyMessage?: string;
  /** When true, renders nothing unless there is at least one pending invitation. */
  hideWhenEmpty?: boolean;
}

export default function PendingInvitationsCard({
  onInvitationResponded,
  emptyMessage = 'You have no pending project invitations.',
  hideWhenEmpty = false,
}: PendingInvitationsCardProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    setError(null);
    const result = await getMyInvitations();
    if (result.error) {
      setError(result.error);
      setInvitations([]);
    } else {
      setInvitations(result.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      await loadInvitations();
      if (cancelled) return;
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [loadInvitations]);

  useEffect(() => {
    function handleExternalRefresh() {
      void loadInvitations();
    }
    window.addEventListener(PROJECT_INVITATION_RESPONDED_EVENT, handleExternalRefresh);
    return () => window.removeEventListener(PROJECT_INVITATION_RESPONDED_EVENT, handleExternalRefresh);
  }, [loadInvitations]);

  async function handleRespond(invitation: Invitation, accept: boolean) {
    setRespondingId(invitation.id);
    const result = await respondToInvitation(invitation.id, accept);
    if (result.error) {
      setError(result.error);
      setRespondingId(null);
      return;
    }

    setError(null);
    const detail: ProjectInvitationRespondedDetail = {
      accept,
      projectId: result.data?.projectId || invitation.project_id,
      invitationId: invitation.id,
    };
    onInvitationResponded?.(detail);
    window.dispatchEvent(
      new CustomEvent(PROJECT_INVITATION_RESPONDED_EVENT, { detail }),
    );
    await loadInvitations();
    setRespondingId(null);
  }

  if (hideWhenEmpty && (loading || invitations.length === 0)) {
    return null;
  }

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardIconHeader
        className="flex-shrink-0"
        title="Pending Invitations"
        description={
          !loading && invitations.length > 0
            ? `${invitations.length} pending ${invitations.length === 1 ? 'invitation' : 'invitations'}`
            : undefined
        }
        icon={<FiMail className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {loading ? (
          <p className="font-sans text-sm text-neutral-500 py-4">Loading invitations...</p>
        ) : error ? (
          <p className="font-sans text-sm text-archivumRed py-4">{error}</p>
        ) : invitations.length === 0 ? (
          <p className="font-sans text-sm text-neutral-500 py-4">{emptyMessage}</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto space-y-3 pr-1 -mr-1">
            {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex justify-between py-4 px-6 border border-neutral-200 rounded-lg hover:border-oxfordBlue/40 hover:bg-oxfordBlue/5 transition-all"
            >
              <div className="flex flex-col justify-around min-w-0">
                <h3 className="font-semibold text-eerieBlack text-md mb-0.5">
                  {invitation.project_title}
                </h3>
                <div>
                  <p className="font-sans text-xs text-neutral-600 mb-1">
                    Invited by {invitation.invited_by_name} &middot; Role:{' '}
                    {formatInvitationRole(invitation.role, invitation.contributor_role)}
                  </p>
                  {invitation.invited_at && (
                    <p className="font-sans text-xs text-neutral-500">
                      {format(new Date(invitation.invited_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="accept"
                  size="sm"
                  leftIcon={<FiCheck className="text-sm" />}
                  loading={respondingId === invitation.id}
                  disabled={respondingId !== null && respondingId !== invitation.id}
                  onClick={() => handleRespond(invitation, true)}
                >
                  Accept
                </Button>
                <Button
                  variant="error"
                  size="sm"
                  leftIcon={<FiX className="text-sm" />}
                  disabled={respondingId !== null}
                  onClick={() => handleRespond(invitation, false)}
                >
                  Decline
                </Button>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
