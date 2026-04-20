'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import Button from './Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Avatar from './ui/Avatar';
import { useRouter } from 'next/navigation';
import { completeProfile } from '@/lib/api/users';

export interface NewAccountConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  googleDisplayName?: string | null;
  googlePhotoUrl?: string | null;
}

type UserRole = 'student' | 'teacher' | 'coordinator';

interface FormData {
  role: UserRole | '';
  displayName: string;
  institutionName: string;
}

interface ValidationErrors {
  role?: string;
  displayName?: string;
  institutionName?: string;
}

export default function NewAccountConfigModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  googleDisplayName,
  googlePhotoUrl
}: NewAccountConfigModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    role: '',
    displayName: googleDisplayName || '',
    institutionName: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(googlePhotoUrl || null);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Pre-fill display name and avatar when Google data is available
  useEffect(() => {
    if (googleDisplayName && !formData.displayName) {
      setFormData(prev => ({ ...prev, displayName: googleDisplayName }));
    }
    if (googlePhotoUrl && !avatarPreview) {
      setAvatarPreview(googlePhotoUrl);
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

    if (formData.role === 'coordinator' && !formData.institutionName.trim()) {
      newErrors.institutionName = 'Institution name is required for coordinators';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setGeneralError(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - only JPG, JPEG, PNG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setGeneralError('Please select a valid image file (JPG, JPEG, or PNG only)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setGeneralError('Image size must be less than 10MB');
      return;
    }

    setAvatarFile(file);
    
    // Create preview URL
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
    
    // Clear previous errors
    setGeneralError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const result = await completeProfile({
      displayName: formData.displayName,
      role: formData.role as 'student' | 'teacher' | 'coordinator',
      email: userEmail,
      avatarFile: avatarFile,
      googlePhotoUrl: googlePhotoUrl,
      institutionName: formData.role === 'coordinator' ? formData.institutionName : undefined,
    });

    if (!result.success) {
      setGeneralError(result.error || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const redirectPath = result.redirectPath || (formData.role === 'student' ? '/student' : formData.role === 'coordinator' ? '/coordinator' : '/adviser');
    onClose();
    router.push(redirectPath);
  };

  const roleOptions = [
    { value: '', label: 'Select your role' },
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher/Adviser' },
    { value: 'coordinator', label: 'Coordinator' }
  ];

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
        {/* Avatar Upload Section */}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAvatarClick}
            >
              Upload Photo
            </Button>
            {avatarPreview && avatarPreview !== googlePhotoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-sm text-neutral-500">
            Optional. Max 10MB. JPG, JPEG, or PNG only
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-2">
            I am a <span className="text-error-500">*</span>
          </label>
          <Select
            id="role"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            options={roleOptions}
            error={errors.role}
            required
          />
        </div>

        {formData.role === 'coordinator' && (
          <div>
            <label htmlFor="institutionName" className="block text-sm font-medium text-neutral-700 mb-2">
              Institution Name <span className="text-error-500">*</span>
            </label>
            <Input
              id="institutionName"
              type="text"
              value={formData.institutionName}
              onChange={(e) => handleInputChange('institutionName' as keyof FormData, e.target.value)}
              placeholder="Enter your institution name"
              error={errors.institutionName}
              required
              maxLength={255}
            />
            <p className="text-xs text-neutral-500 mt-1">
              The institution you will manage as coordinator
            </p>
          </div>
        )}

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-neutral-700 mb-2">
            Display Name <span className="text-error-500">*</span>
          </label>
          <Input
            id="displayName"
            type="text"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            placeholder="Enter your display name"
            error={errors.displayName}
            required
            maxLength={50}
          />
          <p className="text-xs text-neutral-500 mt-1">
            This is how your name will appear to others
          </p>
        </div>

        {/* General Error Message */}
        {generalError && (
          <div className="p-3 bg-error-50 border border-error-200 rounded-md">
            <p className="text-sm text-error-700">{generalError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Complete Setup'}
          </Button>
        </div>

        {/* Required Fields Note */}
        <p className="text-xs text-neutral-500 text-center">
          <span className="text-error-500">*</span> Required fields
        </p>
      </form>
    </Modal>
  );
}
