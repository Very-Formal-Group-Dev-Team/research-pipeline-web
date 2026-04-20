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
import { createProject } from '@/lib/api/projects';
import type { SearchUserResult } from '@/lib/api/users';
import { createPortal } from 'react-dom';

export default function CreateProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, handleLogout } = useDashboardUser('Student');

  // Form state
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [contributorRole, setContributorRole] = useState('');
  const [program, setProgram] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [adviserRole, setAdviserRole] = useState('');
  const [researchType, setResearchType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isContributorModalOpen, setIsContributorModalOpen] = useState(false);
  const [isAdviserModalOpen, setIsAdviserModalOpen] = useState(false);

  const [contributors, setContributors] = useState<SearchUserResult[]>([]);
  const [advisers, setAdvisers] = useState<SearchUserResult[]>([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Error state
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    researchType?: string;
    file?: string;
    general?: string;
  }>({});

    //Track unsaved changes in the form
    const [isDirty, setIsDirty] = useState(false);

    // Automatically mark form as dirty if any important field changes
    useEffect(() => {
      if (
        title || abstract || keywords.length || program || course || section ||
        selectedFile || contributors.length > 1 || advisers.length > 0
      ) {
        setIsDirty(true);
      } else {
        setIsDirty(false);
      }
    }, [title, abstract, keywords, program, course, section, selectedFile, contributors, advisers]);

  useEffect(() => {
    if (user.name && !contributors.find((c) => c.full_name === user.name)) {
      setContributors([{
        id: '',
        email: '',
        full_name: user.name,
        role: 'student',
      }]);
    }
  }, []);


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
    if (contributors.length > 1) {
      setContributors(contributors.filter((_, i) => i !== index));
    } 
  }

  const removeAdviser = (index: number) => {
    setAdvisers(advisers.filter((_, i) => i !== index));
  }

  const handleAddContributor = (user: SearchUserResult) => {
    if (!contributors.find((c) => c.id === user.id)) {
      setContributors([...contributors, user]);
    }
  };

  const handleAddAdviser = (user: SearchUserResult) => {
    if (!advisers.find((a) => a.id === user.id)) {
      setAdvisers([...advisers, user]);
    }
  };

  const handleKeywordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check if user typed a comma
    if (value.includes(',')) {
      // Extract all keywords before the comma
      const newKeywords = value
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      // Add unique keywords only
      const uniqueKeywords = newKeywords.filter(k => !keywords.includes(k));
      if (uniqueKeywords.length > 0) {
        setKeywords([...keywords, ...uniqueKeywords]);
      }
      
      // Clear input
      setKeywordInput('');
    } else {
      setKeywordInput(value);
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace on empty input to remove last tag
    if (e.key === 'Backspace' && keywordInput === '' && keywords.length > 0) {
      e.preventDefault();
      setKeywords(keywords.slice(0, -1));
    }
    
    // Handle Enter key to add keyword
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = keywordInput.trim();
      if (trimmed && !keywords.includes(trimmed)) {
        setKeywords([...keywords, trimmed]);
        setKeywordInput('');
      }
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!abstract.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (!researchType) {
      newErrors.researchType = 'Research type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        abstract: abstract.trim(),
        keywords,
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

      // Redirect to the newly created project detail page
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

            {/* Project Abstract */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Abstract <span className="text-error-500">*</span>
              </label>
              <textarea
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                  errors.description ? 'border-error-500' : 'border-neutral-300'
                }`}
                placeholder="Provide the abstract of your project"
                rows={5}
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-600">{errors.description}</p>
              )}
            </div>
            
            {/* Project Keywords */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Keywords <span className="text-error-500">*</span>
              </label>
              
              {/* Combined Tag and Input Container */}
              <div className="w-full min-h-[48px] px-3 py-2 border border-neutral-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all flex flex-wrap items-center gap-2">
                {/* Tags */}
                {keywords.map((keyword, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    <span>{keyword}</span>
                    <button
                      type="button"
                      onClick={() => removeKeyword(index)}
                      className="ml-0.5 text-primary-600 hover:text-primary-800 hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${keyword}`}
                    >
                      <FiX className="text-xs" />
                    </button>
                  </div>
                ))}
                
                {/* Inline Input */}
                <input
                  type="text"
                  className="flex-1 min-w-[120px] outline-none border-none focus:ring-0 px-1 py-1 text-sm"
                  placeholder={keywords.length === 0 ? "Type keywords and press comma or Enter" : ""}
                  value={keywordInput}
                  onChange={handleKeywordInput}
                  onKeyDown={handleKeywordKeyDown}
                />
              </div>
              
              <p className="mt-1 text-xs text-neutral-500">
                Press comma (,) or Enter to add keywords. Backspace to remove last tag.
              </p>
            </div>
            
            {/* Contributors and Roles */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Contributors and Roles <span className="text-error-500">*</span>
              </label>
              <ol>
                {contributors.map((contributor, index) => (
                  <li key={contributor.id || index} className="flex justify-between mb-2">
                  <div className="flex gap-4 items-center">
                    <div className="w-40">
                      <Select 
                        label=""
                        placeholder="Select Role"
                        value={contributorRole}
                        onChange={(e) => setContributorRole(e.target.value)}
                        options={[
                          { value: 'Author', label: 'Author'},
                          { value: 'Editor', label: 'Editor'},
                          { value: 'Compiler', label: 'Compiler'},
                          { value: 'Translator', label: 'Translator'}
                        ]}
                      />
                    </div>
                    <Avatar src={contributor.avatar_url} name={contributor.full_name} size="sm" />
                    <div>
                      <p className="text-base font-medium">{contributor.full_name}</p>
                      {contributor.email && (
                        <p className="text-xs text-neutral-500">{contributor.email}</p>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => removeContributor(index)}>
                    <FaRegTrashAlt className="text-gray-500 text-xl"/>
                  </button>
                </li>
                ))}
              </ol>
              <div className="flex justify-center mt-1">
                <Button
                  type="button"
                  size='sm'
                  leftIcon=<FaPlusCircle/>
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
                Adviser and co-adviser (if any) <span className="text-error-500">*</span>
              </label>
              <ol>
                {advisers.map((adviser, index) => (
                  <li key={adviser.id || index} className="flex justify-between gap-4 mb-2">
                    <div className="flex gap-4 items-center">
                      <div className="w-40">
                        <Select 
                          label=""
                          placeholder="Select Role"
                          value={adviserRole}
                          onChange={(e) => setAdviserRole(e.target.value)}
                          options={[
                            { value: 'Adviser', label: 'Adviser'},
                            { value: 'Co-adviser', label: 'Co-adviser'}
                          ]}
                        />
                      </div>
                      <Avatar src={adviser.avatar_url} name={adviser.full_name} size="sm" />
                      <div>
                        <p className="text-base font-medium">{adviser.full_name}</p>
                        {adviser.email && (
                          <p className="text-xs text-neutral-500">{adviser.email}</p>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeAdviser(index)}>
                      <FaRegTrashAlt className="text-gray-500 text-xl"/>
                    </button>
                  </li>
                ))}
              </ol>
              <Button
                type="button" 
                size='sm'
                leftIcon=<FaPlusCircle/>
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
                { value: 'IAAA', label: 'IAAA' },
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
          excludeIds={contributors.map((c) => c.id).filter(Boolean)}
        />

        <UserSearchModal
          isOpen={isAdviserModalOpen}
          onClose={() => setIsAdviserModalOpen(false)}
          onSelect={handleAddAdviser}
          role="adviser"
          title="Invite Adviser"
          excludeIds={advisers.map((a) => a.id).filter(Boolean)}
        />
      </div>
    </DashboardLayout>
  );
}
