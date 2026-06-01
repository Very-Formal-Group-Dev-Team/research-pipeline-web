'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, Input, Select, Avatar } from '@/components/ui';
import Button from '@/components/Button';
import UserSearchModal from '@/components/UserSearchModal';
import { FiUpload, FiX } from 'react-icons/fi';
import { FaPlusCircle, FaRegTrashAlt } from 'react-icons/fa';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { createProject, inviteToProject } from '@/lib/api/projects';
import type { SearchUserResult } from '@/lib/api/users';
import { createPortal } from 'react-dom';

const CONTRIBUTOR_ROLE_OPTIONS = [
  { value: 'Author', label: 'Author' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Compiler', label: 'Compiler' },
  { value: 'Translator', label: 'Translator' },
];

const ADVISER_ROLE_OPTIONS = [
  { value: 'Adviser', label: 'Adviser' },
  { value: 'Co-adviser', label: 'Co-adviser' },
];

interface InvitedContributor {
  user: SearchUserResult;
  contributorRole: string;
}

interface InvitedAdviser {
  user: SearchUserResult;
  adviserRole: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, profile, handleLogout } = useDashboardUser('Student');

  // Form state
  const [title, setTitle] = useState('');
  const [creatorRole, setCreatorRole] = useState('Author');
  const [program, setProgram] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [researchType, setResearchType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isContributorModalOpen, setIsContributorModalOpen] = useState(false);
  const [isAdviserModalOpen, setIsAdviserModalOpen] = useState(false);

  const [invitedContributors, setInvitedContributors] = useState<InvitedContributor[]>([]);
  const [invitedAdvisers, setInvitedAdvisers] = useState<InvitedAdviser[]>([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Error state
  const [errors, setErrors] = useState<{
    title?: string;
    researchType?: string;
    contributors?: string;
    advisers?: string;
    file?: string;
    general?: string;
  }>({});

    //Track unsaved changes in the form
    const [isDirty, setIsDirty] = useState(false);

    // Automatically mark form as dirty if any important field changes
    useEffect(() => {
      if (
        title ||
        researchType ||
        program ||
        course ||
        section ||
        selectedFile ||
        invitedContributors.length > 0 ||
        invitedAdvisers.length > 0
      ) {
        setIsDirty(true);
      } else {
        setIsDirty(false);
      }
    }, [title, researchType, program, course, section, selectedFile, invitedContributors, invitedAdvisers]);


  const validateFile = (file: File): string | null => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, DOC, and DOCX files are allowed';
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors({ ...errors, file: error });
      return;
    }

    setSelectedFile(file);
    setErrors({ ...errors, file: undefined });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
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

    const error = validateFile(file);
    if (error) {
      setErrors({ ...errors, file: error });
      return;
    }

    setSelectedFile(file);
    setErrors({ ...errors, file: undefined });
  };

  const removeContributor = (index: number) => {
    setInvitedContributors(invitedContributors.filter((_, i) => i !== index));
  };

  const removeAdviser = (index: number) => {
    setInvitedAdvisers(invitedAdvisers.filter((_, i) => i !== index));
  };

  const handleAddContributor = (user: SearchUserResult) => {
    if (!user.id || user.id === profile?.id) return;
    if (!invitedContributors.find((c) => c.user.id === user.id)) {
      setInvitedContributors([...invitedContributors, { user, contributorRole: '' }]);
    }
  };

  const handleAddAdviser = (user: SearchUserResult) => {
    if (!user.id || user.id === profile?.id) return;
    if (!invitedAdvisers.find((a) => a.user.id === user.id)) {
      setInvitedAdvisers([...invitedAdvisers, { user, adviserRole: '' }]);
    }
  };

  const updateContributorRole = (index: number, contributorRole: string) => {
    setInvitedContributors((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, contributorRole } : entry)),
    );
  };

  const updateAdviserRole = (index: number, adviserRole: string) => {
    setInvitedAdvisers((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, adviserRole } : entry)),
    );
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!researchType) {
      newErrors.researchType = 'Research type is required';
    }

    if (!creatorRole) {
      newErrors.contributors = 'Select your role on this project';
    }

    const contributorMissingRole = invitedContributors.find((c) => !c.contributorRole);
    if (contributorMissingRole) {
      newErrors.contributors = 'Select a role for each invited contributor';
    }

    const adviserMissingRole = invitedAdvisers.find((a) => !a.adviserRole);
    if (adviserMissingRole) {
      newErrors.advisers = 'Select a role for each invited adviser';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function sendInvitationsAfterCreate(projectId: string) {
    const failures: string[] = [];

    for (const { user, contributorRole } of invitedContributors) {
      const res = await inviteToProject(projectId, {
        userId: user.id,
        role: 'member',
        contributorRole,
      });
      if (res.error) {
        failures.push(`${user.full_name}: ${res.error}`);
      }
    }

    for (const { user, adviserRole } of invitedAdvisers) {
      const res = await inviteToProject(projectId, {
        userId: user.id,
        role: 'adviser',
        contributorRole: adviserRole,
      });
      if (res.error) {
        failures.push(`${user.full_name}: ${res.error}`);
      }
    }

    return failures;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await createProject({
        title: title.trim(),
        researchType,
        program: program.trim() || undefined,
        course: course.trim() || undefined,
        section: section.trim() || undefined,
        file: selectedFile,
      });

      if (res.error || !res.data) {
        setErrors({ general: res.error || 'Failed to create project' });
        setIsSubmitting(false);
        return;
      }

      const inviteFailures = await sendInvitationsAfterCreate(res.data.projectId);

      if (inviteFailures.length > 0) {
        setErrors({
          general: `Project created, but some invitations failed: ${inviteFailures.join('; ')}. You can retry from the project page.`,
        });
        setIsSubmitting(false);
        router.push(`/student/projects/${res.data.projectId}`);
        return;
      }

      router.push(`/student/projects/${res.data.projectId}`);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'An unexpected error occurred' });
      setIsSubmitting(false);
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setErrors({ ...errors, file: undefined });
  };

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Create New Project</h1>
          <p className="text-neutral-600 mt-1">Start your research project</p>
        </div>

        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            {/* Project Title */}
            <Input
              label="Project Title"
              placeholder="Enter your project title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
            />
            
            {/* Contributors and Roles */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Contributors and Roles <span className="text-error-500">*</span>
              </label>
              {errors.contributors && (
                <p className="text-sm text-error-600 mb-2">{errors.contributors}</p>
              )}
              <ol className="space-y-2">
                {user.name && (
                  <li className="flex justify-between mb-2">
                    <div className="flex gap-4 items-center flex-1 min-w-0">
                      <div className="w-40 flex-shrink-0">
                        <Select
                          label=""
                          placeholder="Select Role"
                          value={creatorRole}
                          onChange={(e) => setCreatorRole(e.target.value)}
                          options={CONTRIBUTOR_ROLE_OPTIONS}
                          required
                        />
                      </div>
                      <Avatar src={profile?.avatar} name={user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-base font-medium">{user.name}</p>
                        {user.email && (
                          <p className="text-xs text-neutral-500">{user.email}</p>
                        )}
                        <p className="text-xs text-neutral-400">You (project creator)</p>
                      </div>
                    </div>
                  </li>
                )}
                {invitedContributors.map(({ user: contributor, contributorRole }, index) => (
                  <li key={contributor.id} className="flex justify-between mb-2 gap-2">
                    <div className="flex gap-4 items-center flex-1 min-w-0">
                      <div className="w-40 flex-shrink-0">
                        <Select
                          label=""
                          placeholder="Select Role"
                          value={contributorRole}
                          onChange={(e) => updateContributorRole(index, e.target.value)}
                          options={CONTRIBUTOR_ROLE_OPTIONS}
                          required
                        />
                      </div>
                      <Avatar src={contributor.avatar_url} name={contributor.full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-base font-medium">{contributor.full_name}</p>
                        {contributor.email && (
                          <p className="text-xs text-neutral-500">{contributor.email}</p>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeContributor(index)} aria-label="Remove contributor">
                      <FaRegTrashAlt className="text-gray-500 text-xl" />
                    </button>
                  </li>
                ))}
              </ol>
              <div className="flex justify-center mt-1">
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<FaPlusCircle />}
                  variant="ghost"
                  onClick={() => setIsContributorModalOpen(true)}
                  disabled={isSubmitting}
                  className="w-full mt-2"
                >
                  Invite Contributor
                </Button>
              </div>
            </div>

            {/* Program, course, section */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Program"
                  placeholder="Enter program name"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                />
                <Input
                  label="Course"
                  placeholder="Enter course name"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
                <Input
                  label="Section"
                  placeholder="Enter section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </div>
            </div>

            {/* Adviser and co-adviser (if any) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Adviser and co-adviser (if any)
              </label>
              {errors.advisers && (
                <p className="text-sm text-error-600 mb-2">{errors.advisers}</p>
              )}
              <ol className="space-y-2">
                {invitedAdvisers.map(({ user: adviser, adviserRole }, index) => (
                  <li key={adviser.id} className="flex justify-between gap-4 mb-2">
                    <div className="flex gap-4 items-center flex-1 min-w-0">
                      <div className="w-40 flex-shrink-0">
                        <Select
                          label=""
                          placeholder="Select Role"
                          value={adviserRole}
                          onChange={(e) => updateAdviserRole(index, e.target.value)}
                          options={ADVISER_ROLE_OPTIONS}
                          required
                        />
                      </div>
                      <Avatar src={adviser.avatar_url} name={adviser.full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-base font-medium">{adviser.full_name}</p>
                        {adviser.email && (
                          <p className="text-xs text-neutral-500">{adviser.email}</p>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeAdviser(index)} aria-label="Remove adviser">
                      <FaRegTrashAlt className="text-gray-500 text-xl" />
                    </button>
                  </li>
                ))}
              </ol>
              <Button
                type="button"
                size="sm"
                leftIcon={<FaPlusCircle />}
                variant="ghost"
                onClick={() => setIsAdviserModalOpen(true)}
                disabled={isSubmitting}
                className="w-full mt-2"
              >
                Invite Adviser
              </Button>
            </div>
            
            {/* Paper Standard */}
            <Select
              label="Paper Standard"
              placeholder="Select paper standard"
              value={researchType}
              onChange={(e) => setResearchType(e.target.value)}
              options={[
                { value: 'IMRAD', label: 'IMRAD' },
                { value: 'IEEE', label: 'IEEE' },
                { value: 'custom', label: 'Custom' },
              ]}
              error={errors.researchType}
              required
            />

            {/* Document Attachment Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-neutral-700">
                Document Attachment (Optional)
              </label>
              
              {/* File Upload Area with Drag and Drop */}
              {!selectedFile && (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 transition-all ${
                    isDragging
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-300 hover:border-primary-500 hover:bg-neutral-50'
                  }`}
                >
                  <label className="cursor-pointer flex flex-col items-center space-y-3">
                    <div className={`p-4 rounded-full transition-colors ${
                      isDragging ? 'bg-primary-100' : 'bg-neutral-100'
                    }`}>
                      <FiUpload className={`text-3xl transition-colors ${
                        isDragging ? 'text-primary-600' : 'text-neutral-400'
                      }`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-neutral-700">
                        {isDragging ? 'Drop file here' : 'Drag and drop your file here'}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">or click to browse</p>
                      <p className="text-xs text-neutral-500 mt-2">PDF, DOC, DOCX (Max 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}

              {/* File Selected */}
              {selectedFile && (
                <div className="border border-neutral-300 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded">
                        <FiUpload className="text-primary-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-700">{selectedFile.name}</p>
                        <p className="text-xs text-neutral-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="text-neutral-500 hover:text-error-600 transition-colors"
                    >
                      <FiX className="text-xl" />
                    </button>
                  </div>
                </div>
              )}

              {errors.file && (
                <p className="text-sm text-error-600">{errors.file}</p>
              )}
            </div>

            {/*Form Actions*/}
            <div className="flex justify-between pt-4 border-t border-neutral-200">
              {/* Cancel button on the left */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Only show modal if there are unsaved changes
                  if (isDirty) {
                    setIsCancelModalOpen(true);
                  } else {
                    router.push('/student/projects');
                  }
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {/* Primary Create button on the right */}
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Card>
                {/* ADDED: Cancel Confirmation Modal --- */}
            {isCancelModalOpen &&
              typeof document !== 'undefined' &&
              createPortal(
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40 transition-opacity duration-200 ease-out">
                  <div className="bg-white rounded-lg shadow-lg p-6 transform transition-all duration-200 ease-out scale-95 opacity-0 animate-modal-in">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-2">
                      Discard Changes?
                    </h2>
                    <p className="text-sm text-neutral-600 mb-4">
                      You have unsaved changes. Are you sure you want to cancel? All progress will be lost.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCancelModalOpen(false)}
                      >
                        Continue Editing
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          setIsCancelModalOpen(false);
                          router.push('/student/projects');
                        }}
                      >
                        Discard Changes
                      </Button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

        <UserSearchModal
          isOpen={isContributorModalOpen}
          onClose={() => setIsContributorModalOpen(false)}
          onSelect={handleAddContributor}
          role="student"
          title="Invite Contributor"
          excludeIds={[
            ...(profile?.id ? [profile.id] : []),
            ...invitedContributors.map((c) => c.user.id),
            ...invitedAdvisers.map((a) => a.user.id),
          ]}
        />

        <UserSearchModal
          isOpen={isAdviserModalOpen}
          onClose={() => setIsAdviserModalOpen(false)}
          onSelect={handleAddAdviser}
          role="adviser"
          title="Invite Adviser"
          excludeIds={[
            ...(profile?.id ? [profile.id] : []),
            ...invitedContributors.map((c) => c.user.id),
            ...invitedAdvisers.map((a) => a.user.id),
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
