'use client';

import React, { useState } from 'react';
import { LuLink } from 'react-icons/lu';
import { RxEnter } from 'react-icons/rx';
import Card from './Card';
import CardIconHeader from './CardIconHeader';
import Button from '../Button';
import { joinProject } from '@/lib/api/projects';
import { formControlFocusGlowClassName } from '@/lib/utils/formControls';

interface JoinGroupCardProps {
  onJoined?: () => void;
}

const PROJECT_NOT_FOUND_MESSAGE =
  'No project found with that code. Double-check the code with your team leader and try again.';

function normalizeJoinError(error: string): string {
  if (error === 'No project found with that code' || error === 'Project not found') {
    return PROJECT_NOT_FOUND_MESSAGE;
  }
  return error;
}

export default function JoinGroupCard({ onJoined }: JoinGroupCardProps) {
  const [groupCode, setGroupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      setError('Please enter a group code');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await joinProject({ projectCode: groupCode.trim() });
      if (res.error) {
        setError(normalizeJoinError(res.error));
      } else if (res.data) {
        setSuccess(
          res.data.message ||
            (res.data.pending
              ? 'Join request sent. The project leader will review your request.'
              : 'Successfully joined project!'),
        );
        setGroupCode('');
        if (!res.data.pending) {
          onJoined?.();
        }
      } else {
        setError('Unexpected response from server');
      }
    } catch {
      setError('Failed to join project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex h-full flex-col gap-3">
      <CardIconHeader
        title="Join a Project"
        description="Enter the project code provided by the team leader to join a research project"
        icon={<LuLink className="h-8 w-8 stroke-[2.25]" strokeWidth={2.25} aria-hidden />}
        className="mb-0"
      />

      <div className="space-y-3">
        {error && (
          <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-xs text-error-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
            <p className="text-xs text-success-700">{success}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-end lg:flex-col lg:items-stretch xl:flex-row xl:items-end">
          <div className="min-w-0 w-full flex-1">
            <label className="font-sans block text-xs font-medium text-neutral-700 mb-1.5">
              Project Code
            </label>
            <input
              type="text"
              value={groupCode}
              onChange={(e) => {
                setGroupCode(e.target.value);
                setError(null);
                setSuccess(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleJoinGroup();
                }
              }}
              placeholder="Enter project code"
              disabled={isLoading}
              className={`font-sans h-11 w-full px-4 border border-neutral-300 rounded-lg text-sm placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:cursor-not-allowed ${formControlFocusGlowClassName}`}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            className="h-11 w-full shrink-0 px-4 text-sm md:w-auto lg:w-full xl:w-auto"
            onClick={handleJoinGroup}
            disabled={isLoading}
            loading={isLoading}
            leftIcon={
              !isLoading ? (
                <RxEnter
                  className="h-4 w-4 shrink-0 stroke-current stroke-[0.5px] [paint-order:stroke_fill]"
                  aria-hidden
                />
              ) : undefined
            }
          >
            {isLoading ? 'Joining...' : 'Join Group'}
          </Button>
        </div>
      </div>

      <p className="font-sans text-xs text-neutral-500">
        Project code is available in the projects page.
      </p>
    </Card>
  );
}
