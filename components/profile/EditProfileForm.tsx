'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiSave, FiUploadCloud } from 'react-icons/fi';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { updateUserProfile, uploadUserAvatar } from '@/lib/api/users';
import { toast } from 'sonner';
import {
  formControlClassName,
  formControlTextSizeClassName,
  formLabelClassName,
} from '@/lib/utils/formControls';

export interface EditProfileUser {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  statusText?: string;
}

export interface EditProfileFormProps {
  user: EditProfileUser;
  onSaved: () => void;
  statusPlaceholder?: string;
}

const ACCEPTED_AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ACCEPTED_AVATAR_EXTENSION = /\.(jpe?g|png|webp)$/i;

function isAcceptedAvatarFile(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  if (mime && ACCEPTED_AVATAR_MIME_TYPES.has(mime)) return true;
  return ACCEPTED_AVATAR_EXTENSION.test(file.name);
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={formLabelClassName}>{label}</p>
      <p
        className={`${formControlClassName} ${formControlTextSizeClassName} bg-neutral-50 text-neutral-700`}
      >
        {value}
      </p>
    </div>
  );
}

export default function EditProfileForm({
  user,
  onSaved,
  statusPlaceholder = 'Add a short status',
}: EditProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [statusText, setStatusText] = useState(user.statusText || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name);
    setStatusText(user.statusText || '');
    setAvatarPreview(user.avatarUrl || '');
    setAvatarFile(null);
  }, [user.name, user.statusText, user.avatarUrl]);

  const profileDirty = useMemo(
    () =>
      name.trim() !== user.name ||
      statusText.trim() !== (user.statusText || '') ||
      avatarFile !== null,
    [name, statusText, avatarFile, user.name, user.statusText],
  );

  const handleUpdate = async () => {
    if (!profileDirty) return;

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

      toast.success('Changes saved');
      onSaved();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const processAvatarFile = (file: File) => {
    if (!isAcceptedAvatarFile(file)) {
      setError('Only JPG, PNG, and WebP images are allowed');
      return;
    }
    setError(null);
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAvatarFile(file);
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processAvatarFile(file);
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void handleUpdate();
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="min-w-0 flex-1 text-sm text-neutral-600">
          Update your display name, status, and profile photo.
        </p>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="shrink-0"
          disabled={loading || !profileDirty}
          loading={loading}
          leftIcon={!loading ? <FiSave className="h-4 w-4" aria-hidden /> : undefined}
        >
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload profile photo"
          className={`flex min-h-full min-w-0 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary-400 bg-primary-50'
              : avatarFile
                ? 'border-success-400 bg-success-50'
                : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            aria-hidden
          />
          <Avatar src={avatarPreview} name={name} size="lg" />
          {avatarFile ? (
            <div className="flex flex-col items-center gap-1">
              <p className="font-medium text-success-700">{avatarFile.name}</p>
              <p className="text-sm text-neutral-500">Click or drop to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FiUploadCloud className="h-8 w-8 text-neutral-400" />
              <p className="font-medium text-neutral-600">
                {isDragging
                  ? 'Drop your photo here'
                  : 'Drop your photo here, or click to browse'}
              </p>
              <p className="text-sm text-neutral-400">JPG, PNG, or WebP</p>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-4">
          <Input
            label="Display name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your display name"
            responsiveText
            fullWidth
            required
          />

          <ReadOnlyField label="Email" value={user.email} />

          <ReadOnlyField label="Role" value={user.role} />

          <Input
            label="Status"
            type="text"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            placeholder={statusPlaceholder}
            responsiveText
            fullWidth
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      ) : null}
    </form>
  );
}
