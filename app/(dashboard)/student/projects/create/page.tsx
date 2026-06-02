'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, Input, Select, Avatar, Modal } from '@/components/ui';
import Button from '@/components/Button';
import UserSearchModal from '@/components/UserSearchModal';
import { FiUpload, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { createProject, inviteToProject } from '@/lib/api/projects';
import type { SearchUserResult } from '@/lib/api/users';

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

interface TeamMemberRowProps {
  role: string;
  onRoleChange: (value: string) => void;
  roleOptions: { value: string; label: string }[];
  avatarUrl?: string;
  name: string;
  email?: string;
  subtitle?: string;
  onRemove?: () => void;
  showRemove?: boolean;
  responsiveRoleSelect?: boolean;
}

function TeamMemberRow({
  role,
  onRoleChange,
  roleOptions,
  avatarUrl,
  name,
  email,
  subtitle,
  onRemove,
  showRemove = false,
  responsiveRoleSelect = false,
}: TeamMemberRowProps) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-6 sm:flex-row sm:items-center">
        <div className="w-full sm:w-36 shrink-0">
          <Select
            label=""
            placeholder="Select role"
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            options={roleOptions}
            responsiveText={responsiveRoleSelect}
            required
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={avatarUrl} name={name} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary-700 truncate">{name}</p>
            {email ? <p className="text-xs text-neutral-500 truncate">{email}</p> : null}
            {subtitle ? <p className="text-xs text-neutral-400">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      {showRemove && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="self-end sm:self-center p-2 text-neutral-400 hover:text-archivumRed transition-colors"
          aria-label={`Remove ${name}`}
        >
          <FiTrash2 className="text-lg" />
        </button>
      ) : null}
    </li>
  );
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, profile, isLoading: profileLoading, handleLogout } = useDashboardUser('Student');

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

  const [isDirty, setIsDirty] = useState(false);

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

  if (profileLoading) {
    return (
      <DashboardLayout role="student" user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">Create New Project</h1>
            <p className="text-neutral-600 mt-1">Set up your research project and invite your team</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => {
              if (isDirty) {
                setIsCancelModalOpen(true);
              } else {
                router.push('/student/projects');
              }
            }}
          >
            Back to Projects
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-full">
          {errors.general ? (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md text-sm">
              {errors.general}
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Project information</CardTitle>
              <CardDescription>Title and class details</CardDescription>
            </CardHeader>
            <div className="mt-4 space-y-4">
              <Input
                label="Project Title"
                placeholder="Enter your project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
                responsiveText
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Program"
                  placeholder="Enter program name"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  responsiveText
                />
                <Input
                  label="Course"
                  placeholder="Enter course name"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  responsiveText
                />
                <Input
                  label="Section"
                  placeholder="Enter section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  responsiveText
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contributors</CardTitle>
              <CardDescription>Your role and collaborators on this project</CardDescription>
            </CardHeader>
            <div className="mt-4 space-y-4">
              {errors.contributors ? (
                <p className="text-sm text-error-600">{errors.contributors}</p>
              ) : null}
              <ul className="space-y-3">
                {user.name ? (
                  <TeamMemberRow
                    role={creatorRole}
                    onRoleChange={setCreatorRole}
                    roleOptions={CONTRIBUTOR_ROLE_OPTIONS}
                    avatarUrl={profile?.avatar}
                    name={user.name}
                    email={user.email}
                    subtitle="You (project creator)"
                    responsiveRoleSelect
                  />
                ) : null}
                {invitedContributors.map(({ user: contributor, contributorRole }, index) => (
                  <TeamMemberRow
                    key={contributor.id}
                    role={contributorRole}
                    onRoleChange={(value) => updateContributorRole(index, value)}
                    roleOptions={CONTRIBUTOR_ROLE_OPTIONS}
                    avatarUrl={contributor.avatar_url}
                    name={contributor.full_name}
                    email={contributor.email}
                    showRemove
                    responsiveRoleSelect
                    onRemove={() => removeContributor(index)}
                  />
                ))}
              </ul>
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<FiPlus />}
                onClick={() => setIsContributorModalOpen(true)}
                disabled={isSubmitting}
              >
                Invite Contributor
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advisers</CardTitle>
              <CardDescription>Optional — invite your adviser or co-adviser</CardDescription>
            </CardHeader>
            <div className="mt-4 space-y-4">
              {errors.advisers ? (
                <p className="text-sm text-error-600">{errors.advisers}</p>
              ) : null}
              {invitedAdvisers.length > 0 ? (
                <ul className="space-y-3">
                  {invitedAdvisers.map(({ user: adviser, adviserRole }, index) => (
                    <TeamMemberRow
                      key={adviser.id}
                      role={adviserRole}
                      onRoleChange={(value) => updateAdviserRole(index, value)}
                      roleOptions={ADVISER_ROLE_OPTIONS}
                      avatarUrl={adviser.avatar_url}
                      name={adviser.full_name}
                      email={adviser.email}
                      showRemove
                      onRemove={() => removeAdviser(index)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-500">No advisers added yet.</p>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<FiPlus />}
                onClick={() => setIsAdviserModalOpen(true)}
                disabled={isSubmitting}
              >
                Invite Adviser
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document attachment</CardTitle>
              <CardDescription>
                Choose a paper standard, then optionally upload your initial document (PDF, DOC, or DOCX, max 10MB)
              </CardDescription>
            </CardHeader>
            <div className="mt-4 space-y-4">
              <div className="max-w-xs sm:max-w-sm">
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
                  responsiveText
                  required
                />
              </div>
              {!selectedFile ? (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-md p-8 transition-all ${
                    isDragging
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-300 hover:border-primary-500 hover:bg-neutral-50'
                  }`}
                >
                  <label className="cursor-pointer flex flex-col items-center gap-3">
                    <div
                      className={`p-3 rounded-full transition-colors ${
                        isDragging ? 'bg-primary-100' : 'bg-neutral-100'
                      }`}
                    >
                      <FiUpload
                        className={`text-2xl transition-colors ${
                          isDragging ? 'text-primary-600' : 'text-neutral-400'
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-neutral-700">
                        {isDragging ? 'Drop file here' : 'Drag and drop your file here'}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">or click to browse</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-md p-4 bg-neutral-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-primary-100 rounded-md shrink-0">
                        <FiUpload className="text-primary-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary-700 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-neutral-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="p-2 text-neutral-500 hover:text-archivumRed transition-colors shrink-0"
                      aria-label="Remove file"
                    >
                      <FiX className="text-lg" />
                    </button>
                  </div>
                </div>
              )}
              {errors.file ? <p className="text-sm text-error-600">{errors.file}</p> : null}
            </div>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
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
            <Button type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>

        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Discard changes?"
          size="sm"
        >
          <p className="text-sm text-neutral-600">
            You have unsaved changes. Are you sure you want to leave? All progress will be lost.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsCancelModalOpen(false)}>
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
        </Modal>

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
