'use client';

import React, { useMemo, useState } from 'react';
import {
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiFilter,
  FiMoreVertical,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';
import { MdOutlineChat } from 'react-icons/md';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Card, { CardTitle } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shadcn/ui/tooltip';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import type { PaperComment, PaperCommentStatus, PaperCommentVisibility } from '@/lib/api/paperComments';
import {
  canDeleteComment,
  canEditComment,
  canReopenThread,
  canRequestRevisionOnThread,
  canResolveThread,
  canToggleVisibility,
  canUnresolveThread,
  formatCommentTimestamp,
  isAdviserAuthor,
  isStudentAuthor,
  isTeamOnlyComment,
  showResolveCheckmark,
  type ManuscriptViewerRole,
} from '@/lib/manuscript/commentPermissions';

type FilterStatus = 'all' | PaperCommentStatus;
type AuthorFilter = 'all' | 'adviser' | 'student';

interface CommentSidebarProps {
  comments: PaperComment[];
  loading?: boolean;
  selectedCommentId?: string | null;
  viewingVersionId?: string;
  currentUserId: string;
  viewerRole: ManuscriptViewerRole;
  canReply?: boolean;
  className?: string;
  onSelectComment?: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  onRequestRevision?: (commentId: string) => void;
  onReopen?: (commentId: string) => void;
  onReply?: (parentId: string, body: string) => Promise<void>;
  onEdit?: (commentId: string, body: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onToggleVisibility?: (commentId: string, visibility: PaperCommentVisibility) => Promise<void>;
  onClose?: () => void;
}

const STATUS_RANK: Record<PaperCommentStatus, number> = {
  needs_revision: 0,
  open: 1,
  resolved: 2,
};

const REPLY_INPUT_CLASS =
  'w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

const EDIT_INPUT_CLASS =
  'w-full rounded-3xl border-2 border-primary-500 bg-white px-4 py-2.5 text-sm text-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none';

function sortThreads<T extends { parent: PaperComment }>(threads: T[], statusFilter: FilterStatus): T[] {
  return [...threads].sort((a, b) => {
    if (statusFilter === 'all') {
      const byStatus = STATUS_RANK[a.parent.status] - STATUS_RANK[b.parent.status];
      if (byStatus !== 0) return byStatus;
    }
    return new Date(b.parent.created_at).getTime() - new Date(a.parent.created_at).getTime();
  });
}

function orphanedAnchorMessage(comment: PaperComment, viewingVersionId?: string): string {
  if (viewingVersionId && comment.anchor_version_id !== viewingVersionId) {
    return 'Original text no longer found in this version.';
  }
  return "Couldn't locate this passage in the document preview.";
}

const STATUS_FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'needs_revision', label: 'Revision' },
  { value: 'resolved', label: 'Resolved' },
];

const AUTHOR_FILTER_OPTIONS: { value: AuthorFilter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'adviser', label: 'Adviser' },
  { value: 'student', label: 'Student' },
];

const FILTER_TRIGGER_BASE =
  'inline-flex w-full items-center justify-between gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-neutral-50';

function getStatusFilterLabel(value: FilterStatus): string {
  return STATUS_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? 'All';
}

function getStatusFilterMenuLabel(value: FilterStatus, count: number): string {
  if (value === 'all') return 'All';
  const label = STATUS_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? value;
  return `${label} (${count})`;
}

function filterTriggerClass(active: boolean): string {
  return `${FILTER_TRIGGER_BASE} ${
    active ? 'border-primary-200 text-primary-700' : 'text-neutral-600'
  }`;
}

interface CommentFilterToolbarProps {
  filter: FilterStatus;
  authorFilter: AuthorFilter;
  counts: {
    open: number;
    needs_revision: number;
    resolved: number;
    adviser: number;
    student: number;
  };
  onFilterChange: (value: FilterStatus) => void;
  onAuthorFilterChange: (value: AuthorFilter) => void;
}

function CommentFilterToolbar({
  filter,
  authorFilter,
  counts,
  onFilterChange,
  onAuthorFilterChange,
}: CommentFilterToolbarProps) {
  const statusLabel = getStatusFilterLabel(filter);
  const authorLabel =
    AUTHOR_FILTER_OPTIONS.find((option) => option.value === authorFilter)?.label ?? 'Everyone';
  const statusFilterActive = filter !== 'all';
  const authorFilterActive = authorFilter !== 'all';
  const anyFilterActive = statusFilterActive || authorFilterActive;

  return (
    <div className="mt-2.5 flex w-full items-center gap-2">
      <FiFilter
        className={`h-4 w-4 shrink-0 ${anyFilterActive ? 'text-primary-600' : 'text-neutral-500'}`}
        aria-hidden
      />
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
        <div className="min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={filterTriggerClass(statusFilterActive)}
                aria-label="Filter by status"
              >
                <span className="truncate">{statusLabel}</span>
                <FiChevronDown className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[9rem] border-neutral-200 bg-white p-1 shadow-medium">
              {STATUS_FILTER_OPTIONS.map(({ value }) => {
                const count = value !== 'all' ? counts[value as keyof typeof counts] ?? 0 : 0;

                return (
                  <DropdownMenuItem
                    key={value}
                    className={`rounded-sm px-3 py-2 text-sm focus:bg-neutral-50 ${
                      filter === value ? 'font-medium text-neutral-900' : 'text-neutral-800'
                    }`}
                    onSelect={() => onFilterChange(value)}
                  >
                    {getStatusFilterMenuLabel(value, count)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={filterTriggerClass(authorFilterActive)}
                aria-label="Filter by author"
              >
                <span className="truncate">{authorLabel}</span>
                <FiChevronDown className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[9rem] border-neutral-200 bg-white p-1 shadow-medium">
              {AUTHOR_FILTER_OPTIONS.map(({ value, label }) => (
                <DropdownMenuItem
                  key={value}
                  className={`rounded-sm px-3 py-2 text-sm focus:bg-neutral-50 ${
                    authorFilter === value ? 'font-medium text-neutral-900' : 'text-neutral-800'
                  }`}
                  onSelect={() => onAuthorFilterChange(value)}
                >
                  {label}
                  {value !== 'all' ? ` (${counts[value]})` : ''}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

interface CommentActionsMenuProps {
  comment: PaperComment;
  replyCount?: number;
  isParent?: boolean;
  currentUserId: string;
  viewerRole: ManuscriptViewerRole;
  onStartEdit: (comment: PaperComment) => void;
  onRequestDelete: (comment: PaperComment, replyCount: number) => void;
  onToggleVisibility?: (commentId: string, visibility: PaperCommentVisibility) => Promise<void>;
  onRequestRevision?: (commentId: string) => void;
  onReopen?: (commentId: string) => void;
}

function IconTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}

function CommentActionsMenu({
  comment,
  replyCount = 0,
  isParent = false,
  currentUserId,
  viewerRole,
  onStartEdit,
  onRequestDelete,
  onToggleVisibility,
  onRequestRevision,
  onReopen,
}: CommentActionsMenuProps) {
  const showEdit = canEditComment(currentUserId, comment);
  const showDelete = canDeleteComment(currentUserId, comment);
  const showVisibility = canToggleVisibility(viewerRole, currentUserId, comment) && onToggleVisibility;
  const showRequestRevision =
    isParent && Boolean(onRequestRevision) && canRequestRevisionOnThread(viewerRole, comment);
  const showReopen = isParent && Boolean(onReopen) && canReopenThread(viewerRole, comment);

  if (!showEdit && !showDelete && !showVisibility && !showRequestRevision && !showReopen) {
    return null;
  }

  const isTeamOnly = isTeamOnlyComment(comment);

  return (
    <DropdownMenu>
      <IconTooltip label="More options">
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="More options"
            onClick={(e) => e.stopPropagation()}
          >
            <FiMoreVertical className="h-4 w-4" aria-hidden />
          </button>
        </DropdownMenuTrigger>
      </IconTooltip>
      <DropdownMenuContent align="end" className="min-w-[11rem] border-neutral-200 bg-white p-1 shadow-medium">
        {showEdit ? (
          <DropdownMenuItem
            className="rounded-sm px-3 py-2 text-sm text-neutral-800 focus:bg-neutral-50"
            onSelect={(e) => {
              e.preventDefault();
              onStartEdit(comment);
            }}
          >
            Edit
          </DropdownMenuItem>
        ) : null}
        {showRequestRevision ? (
          <DropdownMenuItem
            className="rounded-sm px-3 py-2 text-sm text-neutral-800 focus:bg-neutral-50"
            onSelect={(e) => {
              e.preventDefault();
              onRequestRevision!(comment.id);
            }}
          >
            Request revision
          </DropdownMenuItem>
        ) : null}
        {showReopen ? (
          <DropdownMenuItem
            className="rounded-sm px-3 py-2 text-sm text-neutral-800 focus:bg-neutral-50"
            onSelect={(e) => {
              e.preventDefault();
              onReopen!(comment.id);
            }}
          >
            Reopen
          </DropdownMenuItem>
        ) : null}
        {showDelete ? (
          <DropdownMenuItem
            variant="destructive"
            className="rounded-sm px-3 py-2 text-sm focus:bg-error-50 focus:text-error-600"
            onSelect={(e) => {
              e.preventDefault();
              onRequestDelete(comment, replyCount);
            }}
          >
            Delete
          </DropdownMenuItem>
        ) : null}
        {showVisibility ? (
          <DropdownMenuItem
            className="rounded-sm px-3 py-2 text-sm text-neutral-800 focus:bg-neutral-50"
            onSelect={(e) => {
              e.preventDefault();
              onToggleVisibility!(comment.id, isTeamOnly ? 'adviser' : 'team');
            }}
          >
            {isTeamOnly ? 'Show to adviser' : 'Hide from adviser'}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface CommentEntryProps {
  comment: PaperComment;
  replyCount?: number;
  isParent?: boolean;
  viewingVersionId?: string;
  selectedCommentId?: string | null;
  currentUserId: string;
  viewerRole: ManuscriptViewerRole;
  editingId: string | null;
  editBody: string;
  editLoading: boolean;
  onSelectComment?: (commentId: string) => void;
  onStartEdit: (comment: PaperComment) => void;
  onRequestDelete: (comment: PaperComment, replyCount: number) => void;
  onToggleVisibility?: (commentId: string, visibility: PaperCommentVisibility) => Promise<void>;
  onEditBodyChange: (value: string) => void;
  onSaveEdit: (commentId: string) => void;
  onCancelEdit: () => void;
  onResolve?: (commentId: string) => void;
  onReopen?: (commentId: string) => void;
  onRequestRevision?: (commentId: string) => void;
}

function ResolveCheckButton({
  comment,
  viewerRole,
  isParent,
  onResolve,
  onReopen,
}: {
  comment: PaperComment;
  viewerRole: ManuscriptViewerRole;
  isParent?: boolean;
  onResolve?: (commentId: string) => void;
  onReopen?: (commentId: string) => void;
}) {
  if (!isParent || !showResolveCheckmark(viewerRole, comment)) return null;

  const resolved = comment.status === 'resolved';
  const canResolve = canResolveThread(viewerRole, comment);
  const canUnresolve = canUnresolveThread(viewerRole, comment);

  if (resolved) {
    if (canUnresolve) {
      return (
        <IconTooltip label="Mark as unresolved">
          <button
            type="button"
            className="rounded-full p-1.5 text-oxfordBlue transition-colors hover:bg-oxfordBlue/10"
            aria-label="Mark as unresolved"
            onClick={(e) => {
              e.stopPropagation();
              onReopen?.(comment.id);
            }}
          >
            <FiCheckCircle className="h-4 w-4" aria-hidden />
          </button>
        </IconTooltip>
      );
    }
    return (
      <IconTooltip label="Resolved">
        <span className="inline-flex p-1.5 text-oxfordBlue" aria-label="Resolved">
          <FiCheckCircle className="h-4 w-4" aria-hidden />
        </span>
      </IconTooltip>
    );
  }

  if (!canResolve) return null;

  return (
    <IconTooltip label="Mark as resolved">
      <button
        type="button"
        className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
        aria-label="Mark as resolved"
        onClick={(e) => {
          e.stopPropagation();
          onResolve?.(comment.id);
        }}
      >
        <FiCheck className="h-4 w-4" aria-hidden />
      </button>
    </IconTooltip>
  );
}

function CommentEntry({
  comment,
  replyCount = 0,
  isParent = false,
  viewingVersionId,
  selectedCommentId,
  currentUserId,
  viewerRole,
  editingId,
  editBody,
  editLoading,
  onSelectComment,
  onStartEdit,
  onRequestDelete,
  onToggleVisibility,
  onEditBodyChange,
  onSaveEdit,
  onCancelEdit,
  onResolve,
  onReopen,
  onRequestRevision,
}: CommentEntryProps) {
  const isEditing = editingId === comment.id;
  const isSelected = isParent && selectedCommentId === comment.id;

  return (
    <div
      className={`${isParent ? '' : 'pt-3'} ${isParent && isSelected ? '' : ''}`}
      onClick={() => isParent && onSelectComment?.(comment.id)}
      onKeyDown={(e) => {
        if (isParent && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelectComment?.(comment.id);
        }
      }}
      role={isParent ? 'button' : undefined}
      tabIndex={isParent ? 0 : undefined}
    >
      <div className="flex gap-3">
        <Avatar
          src={comment.author_avatar ?? undefined}
          name={comment.author_name || 'User'}
          size="sm"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {comment.author_name || 'User'}
              </p>
              <p className="text-xs text-neutral-500">{formatCommentTimestamp(comment)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {viewerRole === 'student' && isTeamOnlyComment(comment) ? (
                <Badge variant="default" size="sm" className="mr-1">
                  Team only
                </Badge>
              ) : null}
              {isParent && comment.status === 'needs_revision' ? (
                <Badge variant="warning" size="sm" className="mr-1">
                  Needs revision
                </Badge>
              ) : null}
              <ResolveCheckButton
                comment={comment}
                viewerRole={viewerRole}
                isParent={isParent}
                onResolve={onResolve}
                onReopen={onReopen}
              />
              <CommentActionsMenu
                comment={comment}
                replyCount={replyCount}
                isParent={isParent}
                currentUserId={currentUserId}
                viewerRole={viewerRole}
                onStartEdit={onStartEdit}
                onRequestDelete={onRequestDelete}
                onToggleVisibility={onToggleVisibility}
                onRequestRevision={onRequestRevision}
                onReopen={onReopen}
              />
            </div>
          </div>

          {isParent && comment.anchor?.exact ? (
            <p className="mt-2 text-xs italic text-neutral-500 border-l-2 border-amber-300 pl-2 line-clamp-2">
              &ldquo;{comment.anchor.exact}&rdquo;
            </p>
          ) : null}

          {isParent && comment.anchor_status === 'orphaned' ? (
            <p className="mt-2 text-xs text-error-600">{orphanedAnchorMessage(comment, viewingVersionId)}</p>
          ) : null}
          {isParent && comment.anchor_status === 'modified' ? (
            <p className="mt-2 text-xs text-warning-700">Text location shifted in this version.</p>
          ) : null}
          {isParent && comment.touched_by_diff ? (
            <p className="mt-2 text-xs text-primary-700">Changed since this comment was added.</p>
          ) : null}

          <div className="mt-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            {isEditing ? (
              <>
                <textarea
                  value={editBody}
                  onChange={(e) => onEditBodyChange(e.target.value)}
                  rows={2}
                  autoFocus
                  className={EDIT_INPUT_CLASS}
                />
                <div className="mt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                    disabled={editLoading}
                    onClick={onCancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-oxfordBlue px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-deepSpaceBlue disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-800 disabled:opacity-50 disabled:hover:bg-neutral-200"
                    disabled={editLoading || !editBody.trim()}
                    onClick={() => onSaveEdit(comment.id)}
                  >
                    {editLoading ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-800 whitespace-pre-wrap">{comment.body}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentSidebar({
  comments,
  loading = false,
  selectedCommentId,
  viewingVersionId,
  currentUserId,
  viewerRole,
  canReply = false,
  className = '',
  onSelectComment,
  onResolve,
  onRequestRevision,
  onReopen,
  onReply,
  onEdit,
  onDelete,
  onToggleVisibility,
  onClose,
}: CommentSidebarProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [authorFilter, setAuthorFilter] = useState<AuthorFilter>('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [focusedReplyParentId, setFocusedReplyParentId] = useState<string | null>(null);
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ comment: PaperComment; replyCount: number } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const threads = useMemo(() => {
    const parents = comments.filter((c) => !c.parent_id);
    const repliesByParent = new Map<string, PaperComment[]>();
    for (const comment of comments) {
      if (!comment.parent_id) continue;
      const list = repliesByParent.get(comment.parent_id) || [];
      list.push(comment);
      repliesByParent.set(comment.parent_id, list);
    }
    return parents.map((parent) => ({
      parent,
      replies: repliesByParent.get(parent.id) || [],
    }));
  }, [comments]);

  const filteredThreads = useMemo(() => {
    let result = threads;
    if (filter !== 'all') {
      result = result.filter((t) => t.parent.status === filter);
    }
    if (authorFilter === 'adviser') {
      result = result.filter((t) => isAdviserAuthor(t.parent.author_role));
    } else if (authorFilter === 'student') {
      result = result.filter((t) => isStudentAuthor(t.parent.author_role));
    }
    return sortThreads(result, filter);
  }, [threads, filter, authorFilter]);

  const counts = useMemo(() => ({
    open: threads.filter((t) => t.parent.status === 'open').length,
    needs_revision: threads.filter((t) => t.parent.status === 'needs_revision').length,
    resolved: threads.filter((t) => t.parent.status === 'resolved').length,
    adviser: threads.filter((t) => isAdviserAuthor(t.parent.author_role)).length,
    student: threads.filter((t) => isStudentAuthor(t.parent.author_role)).length,
  }), [threads]);

  const handleReply = async (parentId: string) => {
    const body = replyDrafts[parentId] || '';
    if (!onReply || body.length < 1) return;
    setReplyLoadingId(parentId);
    try {
      await onReply(parentId, body.trim());
      setReplyDrafts((prev) => ({ ...prev, [parentId]: '' }));
      setFocusedReplyParentId(null);
    } finally {
      setReplyLoadingId(null);
    }
  };

  const cancelReply = (parentId: string) => {
    setReplyDrafts((prev) => ({ ...prev, [parentId]: '' }));
    setFocusedReplyParentId(null);
  };

  const startEdit = (comment: PaperComment) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBody('');
  };

  const handleEdit = async (commentId: string) => {
    if (!onEdit || !editBody.trim()) return;
    setEditLoading(true);
    try {
      await onEdit(commentId, editBody.trim());
      cancelEdit();
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete || !deleteTarget) return;
    setDeleteLoading(true);
    try {
      await onDelete(deleteTarget.comment.id);
      if (editingId === deleteTarget.comment.id) cancelEdit();
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const entryProps = {
    viewingVersionId,
    selectedCommentId,
    currentUserId,
    viewerRole,
    editingId,
    editBody,
    editLoading,
    onSelectComment,
    onStartEdit: startEdit,
    onRequestDelete: (comment: PaperComment, count: number) =>
      setDeleteTarget({ comment, replyCount: count }),
    onToggleVisibility,
    onEditBodyChange: setEditBody,
    onSaveEdit: handleEdit,
    onCancelEdit: cancelEdit,
    onResolve,
    onReopen,
    onRequestRevision,
  };

  return (
    <>
      <Card padding="none" className={`flex h-full min-h-0 flex-col overflow-hidden ${className}`}>
        <div className="shrink-0 border-b border-neutral-300 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <MdOutlineChat className="shrink-0 text-2xl text-primary-500" aria-hidden />
              <CardTitle className="truncate">Comments</CardTitle>
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="hidden rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 xl:inline-flex"
                aria-label="Hide comments panel"
              >
                <FiX className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <CommentFilterToolbar
            filter={filter}
            authorFilter={authorFilter}
            counts={counts}
            onFilterChange={setFilter}
            onAuthorFilterChange={setAuthorFilter}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-400 py-8">
              <FiRefreshCw className="w-4 h-4 animate-spin" />
              Loading comments…
            </div>
          ) : filteredThreads.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">
              {threads.length > 0 ? 'No comments match these filters.' : 'No comments yet.'}
            </p>
          ) : (
            filteredThreads.map(({ parent, replies }) => {
              const isThreadEditing =
                editingId === parent.id || replies.some((r) => r.id === editingId);
              const replyDraft = replyDrafts[parent.id] || '';
              const showReplyActions =
                focusedReplyParentId === parent.id || replyDraft.length >= 1;

              return (
              <div
                key={parent.id}
                className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
                  selectedCommentId === parent.id
                    ? 'border-primary-300 ring-1 ring-primary-200'
                    : 'border-neutral-200'
                }`}
              >
                <CommentEntry
                  comment={parent}
                  replyCount={replies.length}
                  isParent
                  {...entryProps}
                />

                {replies.length > 0 ? (
                  <div className="mt-1 space-y-3 border-t border-neutral-100 pt-1">
                    {replies.map((reply) => (
                      <CommentEntry
                        key={reply.id}
                        comment={reply}
                        {...entryProps}
                      />
                    ))}
                  </div>
                ) : null}

                {canReply && !isThreadEditing ? (
                  <div className="mt-3 border-t border-neutral-100 pt-3">
                    <input
                      type="text"
                      value={replyDrafts[parent.id] || ''}
                      placeholder="Reply"
                      disabled={replyLoadingId === parent.id}
                      className={REPLY_INPUT_CLASS}
                      onFocus={() => setFocusedReplyParentId(parent.id)}
                      onBlur={() =>
                        setFocusedReplyParentId((id) => (id === parent.id ? null : id))
                      }
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({ ...prev, [parent.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && replyDraft.length >= 1) {
                          e.preventDefault();
                          void handleReply(parent.id);
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelReply(parent.id);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                    {showReplyActions ? (
                      <div className="mt-2 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                          disabled={replyLoadingId === parent.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            cancelReply(parent.id);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-oxfordBlue px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-deepSpaceBlue disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-800 disabled:opacity-50 disabled:hover:bg-neutral-200"
                          disabled={replyLoadingId === parent.id || replyDraft.length < 1}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => void handleReply(parent.id)}
                        >
                          {replyLoadingId === parent.id ? 'Replying…' : 'Reply'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              );
            })
          )}
        </div>
      </Card>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (deleteLoading) return;
          setDeleteTarget(null);
        }}
        title="Delete comment?"
        size="sm"
        dense
      >
        <p className="text-sm text-neutral-600">
          {deleteTarget && deleteTarget.replyCount > 0
            ? `Are you sure you want to delete this comment and ${deleteTarget.replyCount} ${
                deleteTarget.replyCount === 1 ? 'reply' : 'replies'
              }?`
            : 'Are you sure you want to delete this comment?'}
          {' '}
          This action cannot be undone.
        </p>
        <ModalFooter className="!mt-4 !pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeleteTarget(null)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="error"
            size="sm"
            loading={deleteLoading}
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
