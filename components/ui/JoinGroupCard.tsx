'use client';

import React, { useState } from 'react';
import Card from './Card';
import Button from '../Button';
import { joinProject } from '@/lib/api/projects';

interface JoinGroupCardProps {
  onJoined?: () => void;
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
        setError(res.error);
      } else if (res.data) {
        setSuccess(res.data.message || 'Successfully joined project!');
        setGroupCode('');
        onJoined?.();
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
    <Card className="bg-gradient-to-br from-skyBlue/10 to-skyBlue/5 border-skyBlue/20">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-skyBlue/20 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-skyBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-darkSlateBlue mb-1">Join a Project</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Enter the project code provided by your team leader to join a research project
          </p>
          
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

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
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
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg 
                         focus:outline-none focus:shadow-[0_0_12px_rgba(236,30,36,0.15)]
                         text-sm placeholder:text-neutral-400
                         disabled:bg-neutral-100 disabled:cursor-not-allowed"
              />
            </div>
            
            <Button
              variant="error"
              fullWidth
              onClick={handleJoinGroup}
              disabled={isLoading}
              loading={isLoading}
              className="bg-crimsonRed hover:bg-crimsonRed/90"
            >
              {!isLoading && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {isLoading ? 'Joining...' : 'Join Group'}
            </Button>
          </div>
          
          <p className="text-xs text-neutral-500 mt-3">
            Project code is available in the projects page.
          </p>
        </div>
      </div>
    </Card>
  );
}
