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

function formatInvitationRole(role: string, contributorRole?: string | null) {
  if (contributorRole?.trim()) return contributorRole.trim();
  if (!role) return 'Member';
  if (role === 'member') return 'Collaborator';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function PendingInvitationsCard() {
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

  async function handleRespond(invitationId: string, accept: boolean) {
    setRespondingId(invitationId);
    const result = await respondToInvitation(invitationId, accept);
    if (result.error) {
      setError(result.error);
    } else {
      setError(null);
    }
    await loadInvitations();
    setRespondingId(null);
  }

  return (
    <Card className="flex flex-col min-h-0">
      <CardIconHeader
        className="mb-4 flex-shrink-0"
        title="Pending Invitations"
        description={
          !loading && invitations.length > 0
            ? `${invitations.length} pending ${invitations.length === 1 ? 'invitation' : 'invitations'}`
            : undefined
        }
        iconClassName="text-archivumRed"
        icon={<FiMail className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
      />

      {loading ? (
        <p className="font-sans text-sm text-neutral-500 py-4">Loading invitations...</p>
      ) : error ? (
        <p className="font-sans text-sm text-archivumRed py-4">{error}</p>
      ) : invitations.length === 0 ? (
        <p className="font-sans text-sm text-neutral-500 py-4">
          You have no pending project invitations.
        </p>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-3 pr-1 -mr-1">
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
                  className=""
                  leftIcon={<FiCheck className="text-sm" />}
                  loading={respondingId === invitation.id}
                  disabled={respondingId !== null && respondingId !== invitation.id}
                  onClick={() => handleRespond(invitation.id, true)}
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FiX className="text-sm" />}
                  disabled={respondingId !== null}
                  onClick={() => handleRespond(invitation.id, false)}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
