'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import Button from './Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Avatar from './ui/Avatar';
import { useRouter } from 'next/navigation';
import { completeProfile } from '@/lib/api/users';
import { get } from '@/lib/api/client';
import useAuth from '@/lib/hooks/useAuth';
import { markDebriefPending } from '@/lib/onboarding/debriefSession';
import InstitutionSearchField from '@/components/InstitutionSearchField';
import type { RegisteredInstitution } from '@/lib/api/institutions';

export interface NewAccountConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  googleDisplayName?: string | null;
  googlePhotoUrl?: string | null;
}

type UserRole = 'student' | 'teacher' | 'admin';

interface OnboardingRoleOption {
  value: string;
  label: string;
}

const DEFAULT_ROLE_OPTIONS: OnboardingRoleOption[] = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher / Adviser' },
];

interface FormData {
  role: UserRole | '';
  displayName: string;
}

interface ValidationErrors {
  role?: string;
  displayName?: string;
  institution?: string;
}

export default function NewAccountConfigModal({
  isOpen,
  onClose,
  userEmail,
  googleDisplayName,
  googlePhotoUrl,
}: NewAccountConfigModalProps) {
  const router = useRouter();
  const { refresh } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    role: '',
    displayName: googleDisplayName || '',
  });
  const [selectedInstitution, setSelectedInstitution] = useState<RegisteredInstitution | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(googlePhotoUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [roleOptions, setRoleOptions] = useState<OnboardingRoleOption[]>(DEFAULT_ROLE_OPTIONS);

  useEffect(() => {
    if (!isOpen) return;
    void get<{ onboardingRoles?: OnboardingRoleOption[] }>('/public/config').then((res) => {
      if (res.data?.onboardingRoles?.length) {
        setRoleOptions(res.data.onboardingRoles);
      }
    });
  }, [isOpen]);

  useEffect(() => {
    if (googleDisplayName) {
      setFormData((prev) =>
        prev.displayName ? prev : { ...prev, displayName: googleDisplayName }
      );
    }
    if (googlePhotoUrl) {
      setAvatarPreview((prev) => prev ?? googlePhotoUrl);
    }
  }, [googleDisplayName, googlePhotoUrl]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    } else if (formData.displayName.trim().length > 50) {
      newErrors.displayName = 'Display name must be less than 50 characters';
    }

    if (!selectedInstitution) {
      newErrors.institution = 'Please select your institution';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setGeneralError(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setGeneralError('Please select a valid image file (JPG, JPEG, or PNG only)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setGeneralError('Image size must be less than 10MB');
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setGeneralError(null);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(googlePhotoUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const result = await completeProfile({
      displayName: formData.displayName,
      role: formData.role as 'student' | 'teacher' | 'admin',
      email: userEmail,
      avatarFile,
      googlePhotoUrl,
      institutionId: selectedInstitution?.id,
    });

    if (!result.success) {
      setGeneralError(result.error || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
      return;
    }

    markDebriefPending();
    await refresh();
    onClose();
    router.push('/onboarding/welcome');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Your Profile"
      size="md"
      closeOnOverlayClick={false}
      showCloseButton={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <div
            onClick={handleAvatarClick}
            className="cursor-pointer group relative"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAvatarClick();
              }
            }}
          >
            <Avatar
              src={avatarPreview || undefined}
              alt={formData.displayName || 'User avatar'}
              size="xl"
            />
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                Change
              </span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleAvatarChange}
            className="hidden"
            aria-label="Upload avatar"
          />

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleAvatarClick}>
              Upload Photo
            </Button>
            {avatarPreview && avatarPreview !== googlePhotoUrl ? (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar}>
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-sm text-neutral-500">
            Optional. Max 10MB. JPG, JPEG, or PNG only
          </p>
        </div>

        <Select
          label="I am a"
          placeholder="Select your role"
          value={formData.role}
          onChange={(e) => handleInputChange('role', e.target.value)}
          options={roleOptions}
          error={errors.role}
          required
        />

        <InstitutionSearchField
          label="Institution"
          value={selectedInstitution}
          onChange={(institution) => {
            setSelectedInstitution(institution);
            if (errors.institution) {
              setErrors((prev) => ({ ...prev, institution: undefined }));
            }
            setGeneralError(null);
          }}
          error={errors.institution}
          helperText="Search for your school or university"
          required
        />

        <Input
          id="displayName"
          label="Display name"
          type="text"
          value={formData.displayName}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          placeholder="Enter your display name"
          error={errors.displayName}
          helperText="This is how your name will appear to others"
          required
          maxLength={50}
        />

        {generalError ? (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md text-sm">
            {generalError}
          </div>
        ) : null}

        <Button type="submit" variant="primary" fullWidth loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Complete Setup'}
        </Button>

        <p className="text-xs text-neutral-500 text-center">
          <span className="text-error-500">*</span> Required fields
        </p>
      </form>
    </Modal>
  );
}
