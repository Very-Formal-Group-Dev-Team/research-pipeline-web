'use client';

import React, { useMemo, useState } from 'react';
import { FiCheck, FiMessageSquare, FiRefreshCw, FiRotateCcw, FiX } from 'react-icons/fi';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Card, { CardTitle } from '@/components/ui/Card';
import type { PaperComment, PaperCommentStatus } from '@/lib/api/paperComments';

type FilterStatus = 'all' | PaperCommentStatus;
type AuthorFilter = 'all' | 'adviser' | 'student';

interface CommentSidebarProps {
  comments: PaperComment[];
  loading?: boolean;
  selectedCommentId?: string | null;
  canResolve?: boolean;
  canRequestRevision?: boolean;
  canReply?: boolean;
  className?: string;
  onSelectComment?: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  onRequestRevision?: (commentId: string) => void;
  onReopen?: (commentId: string) => void;
  onReply?: (parentId: string, body: string) => Promise<void>;
  onClose?: () => void;
}

const STATUS_RANK: Record<PaperCommentStatus, number> = {
  needs_revision: 0,
  open: 1,
  resolved: 2,
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isStudentRole(role: PaperComment['author_role']): boolean {
  return role === 'leader' || role === 'member';
}

function isAdviserRole(role: PaperComment['author_role']): boolean {
  return role === 'adviser';
}

function statusBadge(status: PaperCommentStatus) {
  if (status === 'resolved') return <Badge variant="success" size="sm">Resolved</Badge>;
  if (status === 'needs_revision') return <Badge variant="warning" size="sm">Needs revision</Badge>;
  return <Badge variant="default" size="sm">Open</Badge>;
}

function authorBadge(role: PaperComment['author_role']) {
  if (isAdviserRole(role)) return <Badge variant="primary" size="sm">Adviser</Badge>;
  if (isStudentRole(role)) return <Badge variant="default" size="sm">Student</Badge>;
  return null;
}

function sortThreads<T extends { parent: PaperComment }>(threads: T[], statusFilter: FilterStatus): T[] {
  return [...threads].sort((a, b) => {
    if (statusFilter === 'all') {
      const byStatus = STATUS_RANK[a.parent.status] - STATUS_RANK[b.parent.status];
      if (byStatus !== 0) return byStatus;
    }
    return new Date(b.parent.created_at).getTime() - new Date(a.parent.created_at).getTime();
  });
}

export default function CommentSidebar({
  comments,
  loading = false,
  selectedCommentId,
  canResolve = false,
  canRequestRevision = false,
  canReply = false,
  className = '',
  onSelectComment,
  onResolve,
  onRequestRevision,
  onReopen,
  onReply,
  onClose,
}: CommentSidebarProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [authorFilter, setAuthorFilter] = useState<AuthorFilter>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

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
      result = result.filter((t) => isAdviserRole(t.parent.author_role));
    } else if (authorFilter === 'student') {
      result = result.filter((t) => isStudentRole(t.parent.author_role));
    }
    return sortThreads(result, filter);
  }, [threads, filter, authorFilter]);

  const counts = useMemo(() => ({
    open: threads.filter((t) => t.parent.status === 'open').length,
    needs_revision: threads.filter((t) => t.parent.status === 'needs_revision').length,
    resolved: threads.filter((t) => t.parent.status === 'resolved').length,
    adviser: threads.filter((t) => isAdviserRole(t.parent.author_role)).length,
    student: threads.filter((t) => isStudentRole(t.parent.author_role)).length,
  }), [threads]);

  const handleReply = async (parentId: string) => {
    if (!onReply || !replyBody.trim()) return;
    setReplyLoading(true);
    await onReply(parentId, replyBody.trim());
    setReplyLoading(false);
    setReplyBody('');
    setReplyingTo(null);
  };

  return (
    <Card padding="none" className={`flex h-full min-h-0 flex-col overflow-hidden ${className}`}>
      <div className="shrink-0 border-b border-neutral-300 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FiMessageSquare className="w-4 h-4 text-primary-500" />
            Comments
          </CardTitle>
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
        <div className="mt-3 flex flex-wrap gap-2">
          {(['all', 'open', 'needs_revision', 'resolved'] as FilterStatus[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filter === value
                  ? 'bg-primary-100 text-primary-800 font-medium'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {value === 'all' ? 'All' : value.replace('_', ' ')}
              {value !== 'all' ? ` (${counts[value as keyof typeof counts] ?? 0})` : ''}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['all', 'adviser', 'student'] as AuthorFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAuthorFilter(value)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                authorFilter === value
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {value === 'all' ? 'Everyone' : value.charAt(0).toUpperCase() + value.slice(1)}
              {value !== 'all' ? ` (${counts[value]})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-400 py-8">
            <FiRefreshCw className="w-4 h-4 animate-spin" />
            Loading comments…
          </div>
        ) : filteredThreads.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">No comments yet.</p>
        ) : (
          filteredThreads.map(({ parent, replies }) => (
            <div
              key={parent.id}
              className={`rounded-md border p-3 transition-colors ${
                selectedCommentId === parent.id
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-neutral-300 bg-neutral-50/60'
              }`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onSelectComment?.(parent.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                      src={parent.author_avatar ?? undefined}
                      name={parent.author_name || 'User'}
                      size="xs"
                    />
                    <span className="text-sm font-medium text-neutral-900 truncate">
                      {parent.author_name}
                    </span>
                    {authorBadge(parent.author_role)}
                  </div>
                  {statusBadge(parent.status)}
                </div>

                {parent.anchor?.exact ? (
                  <p className="text-xs text-neutral-500 italic border-l-2 border-amber-300 pl-2 mb-2 line-clamp-2">
                    &ldquo;{parent.anchor.exact}&rdquo;
                  </p>
                ) : null}

                {parent.anchor_status === 'orphaned' ? (
                  <p className="text-xs text-error-600 mb-2">Original text no longer found in this version.</p>
                ) : null}
                {parent.anchor_status === 'modified' ? (
                  <p className="text-xs text-warning-700 mb-2">Text location shifted in this version.</p>
                ) : null}
                {parent.touched_by_diff ? (
                  <p className="text-xs text-primary-700 mb-2">Changed since this comment was added.</p>
                ) : null}

                <p className="text-sm text-neutral-800 whitespace-pre-wrap">{parent.body}</p>
                <p className="text-xs text-neutral-400 mt-2">
                  v{parent.anchor_version_number} · {formatDate(parent.created_at)}
                </p>
              </button>

              {replies.length > 0 ? (
                <div className="mt-3 pl-3 border-l border-neutral-200 space-y-2">
                  {replies.map((reply) => (
                    <div key={reply.id} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar
                          src={reply.author_avatar ?? undefined}
                          name={reply.author_name || 'User'}
                          size="xs"
                        />
                        <span className="font-medium text-neutral-800">{reply.author_name}</span>
                        {authorBadge(reply.author_role)}
                        <span className="text-xs text-neutral-400">{formatDate(reply.created_at)}</span>
                      </div>
                      <p className="text-neutral-700 whitespace-pre-wrap">{reply.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 mt-3">
                {canResolve && parent.status !== 'resolved' ? (
                  <Button variant="outline" size="sm" onClick={() => onResolve?.(parent.id)}>
                    <FiCheck className="w-3.5 h-3.5 mr-1" />
                    Resolve
                  </Button>
                ) : null}
                {canRequestRevision && parent.status !== 'needs_revision' && parent.status !== 'resolved' ? (
                  <Button variant="outline" size="sm" onClick={() => onRequestRevision?.(parent.id)}>
                    Request revision
                  </Button>
                ) : null}
                {canResolve && parent.status === 'resolved' ? (
                  <Button variant="outline" size="sm" onClick={() => onReopen?.(parent.id)}>
                    <FiRotateCcw className="w-3.5 h-3.5 mr-1" />
                    Reopen
                  </Button>
                ) : null}
                {canReply ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === parent.id ? null : parent.id)}
                  >
                    Reply
                  </Button>
                ) : null}
              </div>

              {replyingTo === parent.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={2}
                    placeholder="Write a reply…"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={replyLoading || !replyBody.trim()}
                    onClick={() => handleReply(parent.id)}
                  >
                    {replyLoading ? 'Sending…' : 'Send reply'}
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
