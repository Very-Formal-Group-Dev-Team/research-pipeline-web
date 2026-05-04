'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FiUploadCloud,
  FiDownload,
  FiFileText,
  FiClock,
  FiTag,
  FiRefreshCw,
  FiGitCommit,
  FiZap,
  FiChevronDown,
  FiPlus,
  FiMinus,
} from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import {
  uploadPaperVersion,
  generatePaperTemplate,
  getPaperVersionDownloadUrl,
  getPaperVersionDiff,
  type PaperVersion,
  type DiffResult,
  type DiffChange,
} from '@/lib/api/paperVersions';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortHash(id: string): string {
  return id.replace(/-/g, '').slice(0, 7);
}

function DiffView({ changes }: { changes: DiffChange[] }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-all max-h-none sm:max-h-96 overflow-visible sm:overflow-y-auto">
      {changes.map((change, i) => {
        if (change.added) {
          return (
            <span key={i} className="bg-success-100 text-success-800 decoration-success-400">
              {change.value}
            </span>
          );
        }
        if (change.removed) {
          return (
            <span key={i} className="bg-error-100 text-error-800 line-through decoration-error-400">
              {change.value}
            </span>
          );
        }
        return <span key={i}>{change.value}</span>;
      })}
    </div>
  );
}

function RenderedDiffView({ diff, mode }: { diff: DiffResult; mode: 'current' | 'previous' }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const html = mode === 'current' ? diff.currentHtml : diff.previousHtml;
    if (!html) {
      container.innerHTML = '<div class="text-sm text-neutral-500 italic">Rendered view not available for this file type.</div>';
      return;
    }

    // Set the HTML first
    container.innerHTML = html;

    if (!diff.changes || diff.changes.length === 0) return;

    // Build the plain text used for mapping: current = all non-removed parts; previous = all non-added parts
    const parts = diff.changes;
    const plain = (mode === 'current'
      ? parts.filter((p) => !p.removed).map((p) => p.value).join('')
      : parts.filter((p) => !p.added).map((p) => p.value).join('')) || '';

    // Collect text nodes with cumulative offsets
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodes: { node: Text; start: number; end: number }[] = [];
    let cur: Node | null = walker.nextNode();
    let idx = 0;
    while (cur) {
      const txt = cur.nodeValue || '';
      const len = txt.length;
      if (len > 0) {
        nodes.push({ node: cur as Text, start: idx, end: idx + len });
        idx += len;
      }
      cur = walker.nextNode();
    }

    const fullText = nodes.map((n) => n.node.nodeValue || '').join('');
    if (!fullText || fullText.length === 0) return;

    // Find ranges for parts in the plain text
    const ranges: { start: number; end: number; type: 'added' | 'removed' }[] = [];
    let pointer = 0;
    for (const part of parts) {
      if (mode === 'current' && part.removed) continue;
      if (mode === 'previous' && part.added) continue;
      const val = part.value || '';
      if (!val) continue;
      const startIndex = fullText.indexOf(val, pointer);
      if (startIndex === -1) {
        // try from beginning if not found
        const alt = fullText.indexOf(val);
        if (alt === -1) continue;
        pointer = alt + val.length;
        ranges.push({ start: alt, end: alt + val.length, type: part.added ? 'added' : part.removed ? 'removed' : 'added' });
      } else {
        ranges.push({ start: startIndex, end: startIndex + val.length, type: part.added ? 'added' : part.removed ? 'removed' : 'added' });
        pointer = startIndex + val.length;
      }
    }

    if (ranges.length === 0) return;

    // Wrap ranges from end -> start to avoid offset invalidation
    ranges.sort((a, b) => b.start - a.start);
    for (const r of ranges) {
      // find start node
      let startNodeIndex = -1;
      for (let i = 0; i < nodes.length; i++) {
        if (r.start >= nodes[i].start && r.start < nodes[i].end) {
          startNodeIndex = i;
          break;
        }
      }
      if (startNodeIndex === -1) continue;

      let endNodeIndex = startNodeIndex;
      while (endNodeIndex < nodes.length && r.end > nodes[endNodeIndex].end) endNodeIndex++;
      if (endNodeIndex >= nodes.length) continue;

      const startNode = nodes[startNodeIndex].node;
      const endNode = nodes[endNodeIndex].node;
      const startOffset = r.start - nodes[startNodeIndex].start;
      const endOffset = r.end - nodes[endNodeIndex].start;

      const range = document.createRange();
      try {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        const wrapper = document.createElement('span');
        if (r.type === 'added') {
          wrapper.className = 'bg-success-100 text-success-800 decoration-success-400';
        } else {
          wrapper.className = 'bg-error-100 text-error-800 line-through decoration-error-400';
        }
        range.surroundContents(wrapper);
      } catch (e) {
        // surroundContents may throw for malformed ranges; ignore and continue
        // (best-effort highlighting)
        // console.error('wrap error', e);
      }
    }
  }, [diff, mode]);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 max-h-none sm:max-h-96 overflow-auto">
      <div ref={containerRef} />
    </div>
  );
}

function VersionCard({
  version,
  isLatest,
  isFirst,
  projectId,
}: {
  version: PaperVersion;
  isLatest: boolean;
  isFirst: boolean;
  projectId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'text' | 'rendered'>('text');
  const [renderSide, setRenderSide] = useState<'current' | 'previous'>('current');

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      // Extract session token from cookie (same as API client does)
      const tokenMatch = document.cookie.match(/(?:^|;\s*)session_token=([^;]*)/);
      const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

      const url = getPaperVersionDownloadUrl(projectId, version.id);
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(url, { 
        credentials: 'include',
        headers,
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = version.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      /* user can retry */
    } finally {
      setDownloading(false);
    }
  };

  const handleToggle = async () => {
    const willExpand = !expanded;
    setExpanded(willExpand);

    if (willExpand && !diff && !diffLoading && !isFirst) {
      setDiffLoading(true);
      setDiffError(null);
      const res = await getPaperVersionDiff(projectId, version.id);
      if (res.error) {
        setDiffError(res.error);
      } else if (res.data) {
        setDiff(res.data);
      }
      setDiffLoading(false);
    }
  };

  const canDiff = !isFirst;

  return (
    <div className="flex gap-3 sm:gap-4">
      {/* Left timeline dot */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
            isLatest
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-200 text-neutral-500'
          }`}
        >
          <FiGitCommit className="w-4 h-4" />
        </div>
        <div className="w-px flex-1 bg-neutral-200 mt-1" />
      </div>

      {/* Card content */}
      <div className="flex-1 mb-4">
        <div
          onClick={canDiff ? handleToggle : undefined}
          className={`rounded-xl border p-4 transition-all ${
            isLatest
              ? 'border-primary-200 bg-primary-50/40'
              : 'border-neutral-200 bg-white'
          } ${canDiff ? 'cursor-pointer hover:shadow-sm' : ''}`}
        >
          {/* Header and buttons row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            {/* Title and badges */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-semibold text-neutral-900 break-words">
                  {version.commit_message.length > 80
                    ? version.commit_message.slice(0, 80) + '…'
                    : version.commit_message}
                </span>

                {isLatest && <Badge variant="primary" size="sm">latest</Badge>}
                {version.is_generated === 1 && (
                  <Badge variant="default" size="sm">
                    <FiZap className="inline w-3 h-3 mr-1" />
                    generated
                  </Badge>
                )}
                {version.tag && version.tag !== 'template' && (
                  <Badge variant="success" size="sm">
                    <FiTag className="inline w-3 h-3 mr-1" />
                    {version.tag}
                  </Badge>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-neutral-500">
                <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-xs text-neutral-600">
                  {shortHash(version.id)}
                </code>
                <span className="font-mono text-xs font-medium text-neutral-600">
                  v{version.version_number}
                </span>
                <span className="flex items-center gap-1">
                  <Avatar
                    src={version.uploader_avatar ?? undefined}
                    name={version.uploader_name}
                    size="xs"
                  />
                  {version.uploader_name}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {formatDate(version.created_at)}
                </span>
                <span className="text-xs">{formatBytes(version.file_size)}</span>
              </div>
            </div>

            {/* Download button and expand icon */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 hover:text-primary-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Download ${version.file_name}`}
              >
                {downloading ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiDownload className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Download</span>
              </button>
              {canDiff && (
                <FiChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                    expanded ? 'rotate-180' : ''
                  }`}
                />
              )}
            </div>
          </div>

          {/* Expanded diff view */}
          {expanded && canDiff && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              {diffLoading && (
                <div className="flex items-center gap-2 text-sm text-neutral-400 py-6 justify-center">
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  Loading diff…
                </div>
              )}

              {diffError && (
                <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">
                  {diffError}
                </p>
              )}

              {diff && !diff.supported && (
                <p className="text-sm text-neutral-500 italic py-2">
                  {diff.message || 'Diff not available for this file type.'}
                </p>
              )}

              {diff && diff.supported && diff.stats && diff.changes && (
                <div className="space-y-3">
                  {/* View mode toggle: Text or Rendered (HTML) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-md bg-neutral-100 p-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewMode('text'); }}
                          className={`px-3 py-1 text-sm rounded ${viewMode === 'text' ? 'bg-white' : 'text-neutral-600'}`}
                        >
                          Text
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewMode('rendered'); }}
                          className={`px-3 py-1 text-sm rounded ${viewMode === 'rendered' ? 'bg-white' : 'text-neutral-600'}`}
                        >
                          Rendered
                        </button>
                      </div>

                      {viewMode === 'rendered' && (
                        <div className="ml-3 inline-flex items-center gap-2 text-sm text-neutral-600">
                          <button
                            onClick={(e) => { e.stopPropagation(); setRenderSide('current'); }}
                            className={`px-2 py-1 rounded ${renderSide === 'current' ? 'bg-neutral-200' : ''}`}
                          >
                            Current
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setRenderSide('previous'); }}
                            className={`px-2 py-1 rounded ${renderSide === 'previous' ? 'bg-neutral-200' : ''}`}
                          >
                            Previous
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {diff.stats.previousWords} → {diff.stats.currentWords} words
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-success-700 font-medium">
                      <FiPlus className="w-3.5 h-3.5" />
                      +{diff.stats.addedWords} words
                    </span>
                    <span className="flex items-center gap-1 text-error-700 font-medium">
                      <FiMinus className="w-3.5 h-3.5" />
                      −{diff.stats.removedWords} words
                    </span>
                    <span className="text-neutral-400 text-xs">
                      {diff.stats.previousWords} → {diff.stats.currentWords} total words
                    </span>
                  </div>
                  {viewMode === 'text' ? (
                    <DiffView changes={diff.changes} />
                  ) : (
                    <RenderedDiffView diff={diff} mode={renderSide} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

//Upload modal
function UploadVersionModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setCommitMessage('');
    setError(null);
    setSubmitting(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (selected: File | null) => {
    if (!selected) return;
    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (!['docx', 'doc', 'pdf'].includes(ext || '')) {
      setError('Only .docx, .doc, or .pdf files are allowed.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10 MB.');
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFile(dropped || null);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Please select a file.'); return; }
    if (!commitMessage.trim()) { setError('Please enter a description of your changes.'); return; }

    setSubmitting(true);
    setError(null);

    const res = await uploadPaperVersion(projectId, file, commitMessage.trim());
    if (res.error) {
      setError(res.error);
      setSubmitting(false);
      return;
    }

    reset();
    onClose();
    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload New Version" size="md">
      <div className="p-6 space-y-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary-400 bg-primary-50'
              : file
              ? 'border-success-400 bg-success-50'
              : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".docx,.doc,.pdf"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FiFileText className="w-8 h-8 text-success-600" />
              <p className="font-medium text-success-700">{file.name}</p>
              <p className="text-sm text-neutral-500">{formatBytes(file.size)}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FiUploadCloud className="w-8 h-8 text-neutral-400" />
              <p className="text-neutral-600 font-medium">
                Drop your paper here, or click to browse
              </p>
              <p className="text-sm text-neutral-400">.docx, .doc, .pdf — max 10 MB</p>
            </div>
          )}
        </div>

        {/* Commit message */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            What changed in this version? <span className="text-error-500">*</span>
          </label>
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="e.g. Added methodology section, revised introduction, corrected citations..."
            rows={3}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 placeholder:text-neutral-400 text-sm resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || !file}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <FiRefreshCw className="animate-spin w-4 h-4" /> Uploading…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FiUploadCloud className="w-4 h-4" /> Upload Version
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

//Main component 
export interface PaperVersionTimelineProps {
  projectId: string;
  paperStandard: string;
  versions: PaperVersion[];
  loading: boolean;
  onRefresh: () => void;
}

export default function PaperVersionTimeline({
  projectId,
  paperStandard,
  versions,
  loading,
  onRefresh,
}: PaperVersionTimelineProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    const res = await generatePaperTemplate(projectId);
    if (res.error) {
      setGenError(res.error);
    } else {
      onRefresh();
    }
    setGenerating(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <FiGitCommit className="text-primary-600" />
            Paper Version History
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            {versions.length === 0
              ? 'No versions yet — upload your draft or generate a template to get started.'
              : `${versions.length} version${versions.length !== 1 ? 's' : ''} · ${paperStandard.toUpperCase()} format`}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {versions.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <span className="flex items-center gap-1.5">
                  <FiRefreshCw className="animate-spin w-3.5 h-3.5" /> Generating…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <FiZap className="w-3.5 h-3.5" />
                  Generate {paperStandard.toUpperCase()} Template
                </span>
              )}
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setUploadOpen(true)}
          >
            <FiUploadCloud className="w-3.5 h-3.5 mr-1.5" />
            Upload New Version
          </Button>
        </div>
      </div>

      {genError && (
        <p className="text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg mb-4">{genError}</p>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-neutral-400">
          <FiRefreshCw className="animate-spin w-5 h-5 mr-2" />
          Loading versions…
        </div>
      ) : versions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-neutral-400">
          <FiFileText className="w-10 h-10" />
          <p className="text-sm">No paper versions yet.</p>
        </div>
      ) : (
        <div>
          {versions.map((v, idx) => (
            <VersionCard
              key={v.id}
              version={v}
              isLatest={idx === 0}
              isFirst={idx === versions.length - 1}
              projectId={projectId}
            />
          ))}
          {/* End of timeline dot */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-neutral-300 ml-2.5" />
            </div>
            <p className="text-xs text-neutral-400 mb-2 mt-0.5">Initial commit</p>
          </div>
        </div>
      )}

      <UploadVersionModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={onRefresh}
        projectId={projectId}
      />
    </div>
  );
}
