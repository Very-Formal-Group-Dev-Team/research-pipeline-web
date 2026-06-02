'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, Input, Select, Avatar, Modal } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import UserSearchModal from '@/components/UserSearchModal';
import { FiUpload, FiX, FiTrash2 } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { createProject, inviteToProject } from '@/lib/api/projects';
import type { SearchUserResult } from '@/lib/api/users';

type InviteMembershipRole = 'member' | 'adviser';

interface InvitedTeamMember {
  user: SearchUserResult;
  membershipRole: InviteMembershipRole;
}

function memberBadgeLabel(membershipRole: InviteMembershipRole): string {
  return membershipRole === 'adviser' ? 'adviser' : 'collaborator';
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, profile, isLoading: profileLoading, handleLogout } = useDashboardUser('Student');

  // Form state
  const [title, setTitle] = useState('');
  const [program, setProgram] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [projectType, setProjectType] = useState('');
  const [researchType, setResearchType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [invitedMembers, setInvitedMembers] = useState<InvitedTeamMember[]>([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Error state
  const [errors, setErrors] = useState<{
    title?: string;
    projectType?: string;
    researchType?: string;
    team?: string;
    file?: string;
    general?: string;
  }>({});

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (
      title ||
      researchType ||
      projectType ||
      program ||
      course ||
      section ||
      selectedFile ||
      invitedMembers.length > 0
    ) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [title, researchType, projectType, program, course, section, selectedFile, invitedMembers]);

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

  const removeInvitedMember = (index: number) => {
    setInvitedMembers(invitedMembers.filter((_, i) => i !== index));
  };

  const handleAddTeamMember = (user: SearchUserResult) => {
    if (!user.id || user.id === profile?.id) return;
    if (invitedMembers.some((m) => m.user.id === user.id)) return;

    const membershipRole: InviteMembershipRole =
      user.role === 'adviser' || user.role === 'teacher' ? 'adviser' : 'member';

    setInvitedMembers([...invitedMembers, { user, membershipRole }]);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!projectType) {
      newErrors.projectType = 'Project type is required';
    }

    if (!researchType) {
      newErrors.researchType = 'Paper standard is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function sendInvitationsAfterCreate(projectId: string) {
    const failures: string[] = [];

    for (const { user, membershipRole } of invitedMembers) {
      const res = await inviteToProject(projectId, {
        userId: user.id,
        role: membershipRole,
        contributorRole: membershipRole === 'adviser' ? 'Adviser' : 'Contributor',
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
        projectType: projectType as 'thesis' | 'capstone',
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Select
                  label="Project Type"
                  placeholder="Select project type"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  options={[
                    { value: 'thesis', label: 'Thesis' },
                    { value: 'capstone', label: 'Capstone' },
                  ]}
                  error={errors.projectType}
                  responsiveText
                  required
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex w-full flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    {user.name ? 1 : 0} {user.name ? 'member' : 'members'}
                    {invitedMembers.length > 0
                      ? ` · ${invitedMembers.length} pending`
                      : ''}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setIsInviteModalOpen(true)}
                  disabled={isSubmitting}
                >
                  Invite Members
                </Button>
              </div>
            </CardHeader>

            {errors.team ? (
              <p className="mb-4 text-sm text-error-600">{errors.team}</p>
            ) : null}

            {user.name || invitedMembers.length > 0 ? (
              <div className="space-y-3">
                {user.name ? (
                  <div className="flex items-center gap-4 rounded-lg border border-primary-300 bg-primary-50/50 p-3">
                    <Avatar src={profile?.avatar} name={user.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-neutral-900 truncate">{user.name}</h4>
                        <span className="text-xs font-medium text-primary-600 whitespace-nowrap">
                          (Leader)
                        </span>
                      </div>
                      {user.email ? (
                        <p className="mt-0.5 text-sm text-neutral-600 break-all">{user.email}</p>
                      ) : null}
                    </div>
                    <Badge variant="primary" className="capitalize shrink-0">
                      leader
                    </Badge>
                  </div>
                ) : null}

                {invitedMembers.length > 0 ? (
                  <>
                    <div className="pt-2 pb-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                        Pending invitations
                      </p>
                    </div>
                    {invitedMembers.map(({ user: member, membershipRole }, index) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                      >
                        <Avatar
                          src={member.avatar_url}
                          name={member.full_name}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-neutral-800 truncate">
                            {member.full_name}
                          </h4>
                          <p className="mt-0.5 text-sm text-neutral-600 break-all">{member.email}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={membershipRole === 'adviser' ? 'success' : 'default'}
                            className="capitalize"
                          >
                            {memberBadgeLabel(membershipRole)}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => removeInvitedMember(index)}
                            className="p-2 text-neutral-400 hover:text-archivumRed transition-colors"
                            aria-label={`Remove ${member.full_name}`}
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : null}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-neutral-500">
                No team members yet. Use Invite Members to add collaborators or advisers.
              </p>
            )}
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
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSelect={handleAddTeamMember}
          title="Invite Members"
          excludeIds={[
            ...(profile?.id ? [profile.id] : []),
            ...invitedMembers.map((m) => m.user.id),
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
