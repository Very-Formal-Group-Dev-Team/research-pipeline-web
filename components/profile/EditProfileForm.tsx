'use client';

import React, { useRef, useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { updateUserProfile, uploadUserAvatar } from '@/lib/api/users';
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
  onClose: () => void;
  statusPlaceholder?: string;
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
  onClose,
  statusPlaceholder = 'Add a short status',
}: EditProfileFormProps) {
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

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void handleUpdate();
      }}
    >
      <p className="text-sm text-neutral-600">
        Update your display name, status, and profile photo.
      </p>

      <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50/50 px-4 py-5">
        <Avatar src={avatarPreview} name={name} size="lg" />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          Change photo
        </Button>
        <p className="text-xs text-neutral-500">JPG, PNG, or WebP</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          aria-label="Upload profile photo"
        />
      </div>

      <div className="space-y-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading} loading={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
