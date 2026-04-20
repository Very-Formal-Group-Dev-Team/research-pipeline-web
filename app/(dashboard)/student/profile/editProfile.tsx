'use client';

import React, { useState, useRef } from 'react';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { updateUserProfile, uploadUserAvatar } from '@/lib/api/users';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  statusText?: string;
}

interface EditProfileProps {
  user: UserProfile;
  onClose: () => void;
}

export default function EditProfile({ user, onClose }: EditProfileProps) {
  const [name, setName] = useState(user.name);
  const [statusText, setStatusText] = useState(user.statusText || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = async () => {
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    setLoading(true);
    try {
      if (avatarFile) {
        const uploadRes = await uploadUserAvatar(avatarFile);
        if (uploadRes.error) {
          setError(`Avatar upload failed: ${uploadRes.error}`);
          setLoading(false);
          return;
        }
      }

      const payload: Record<string, string> = {};
      if (name.trim() !== user.name) payload.full_name = name.trim();
      if (statusText.trim() !== (user.statusText || '')) payload.status_text = statusText.trim();

      if (Object.keys(payload).length > 0) {
        const res = await updateUserProfile(payload);
        if (res.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
      }

      onClose();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleUpdate();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 pb-4 border-b border-neutral-200">
        <Avatar src={avatarPreview} name={name} size="lg" />
        <Button variant="secondary" size="sm" onClick={openFilePicker}>
          Change Avatar
        </Button>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          ref={fileInputRef}
          onChange={handleAvatarChange}
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Display Name
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your display name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Email
          </label>
          <div className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">
            {user.email}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Role
            </label>
            <div className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">
              {user.role}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Status
            </label>
            <Input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="e.g. Working on thesis"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="error" onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </div>
    </div>
  );
}
