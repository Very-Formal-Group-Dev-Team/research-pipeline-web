'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FiDownload,
  FiGitMerge,
  FiLoader,
  FiPlus,
  FiRotateCcw,
  FiRotateCw,
  FiSave,
  FiTag,
  FiX,
} from 'react-icons/fi';

import {
  assignTranscriptionSpeaker,
  downloadEditedTranscription,
  getTranscriptionEdit,
  mergeTranscriptionLines,
  saveTranscriptionEdit,
  type TranscriptionArchiveSegment,
  type TranscriptionEditContent,
  type TranscriptionEditSpeaker,
} from '@/lib/api/recordings';

const SPEAKER_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
  '#0891b2',
  '#ea580c',
  '#be185d',
];

const MAX_HISTORY = 50;

interface TranscriptionEditorPanelProps {
  scheduleId: string;
  recordingId: string;
  projectCode?: string | null;
  initialSegments?: TranscriptionArchiveSegment[];
  initialFullText?: string | null;
  isProcessing?: boolean;
  canManage?: boolean;
  onSeek?: (startMs: number) => void;
  className?: string;
}

function formatMs(ms?: number | null): string {
  if (ms == null || Number.isNaN(ms)) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function createSpeakerId() {
  return crypto.randomUUID();
}

function cloneContent(content: TranscriptionEditContent): TranscriptionEditContent {
  return JSON.parse(JSON.stringify(content)) as TranscriptionEditContent;
}

function nextSpeakerColor(speakers: TranscriptionEditSpeaker[]): string {
  const used = new Set(speakers.map((speaker) => speaker.color));
  const available = SPEAKER_COLORS.find((color) => !used.has(color));
  return available || SPEAKER_COLORS[speakers.length % SPEAKER_COLORS.length];
}

export function segmentsToEditContent(
  segments: TranscriptionArchiveSegment[] = [],
  fullText?: string | null,
): TranscriptionEditContent {
  const linesFromSegments = segments
    .map((segment) => ({
      id: segment.id,
      text: String(segment.text || '').trim(),
      speaker_id: null,
      start_ms: segment.start_ms ?? null,
      end_ms: segment.end_ms ?? null,
    }))
    .filter((line) => line.text);

  if (linesFromSegments.length) {
    return { speakers: [], lines: linesFromSegments };
  }

  const text = String(fullText || '').trim();
  if (!text) {
    return { speakers: [], lines: [] };
  }

  return {
    speakers: [],
    lines: text.split(/\n+/).filter(Boolean).map((lineText, index) => ({
      id: `seed-line-${index + 1}`,
      text: lineText.trim(),
      speaker_id: null,
      start_ms: null,
      end_ms: null,
    })),
  };
}

function formatEditedTranscriptForExport(content: TranscriptionEditContent): string {
  const speakerById = new Map(content.speakers.map((speaker) => [speaker.id, speaker]));
  return content.lines
    .map((line) => {
      const speaker = line.speaker_id ? speakerById.get(line.speaker_id) : null;
      const prefix = speaker ? `[${speaker.name}] ` : '';
      return `${prefix}${line.text.trim()}`.trim();
    })
    .filter(Boolean)
    .join('\n\n');
}

function downloadTextFile(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function useEditorHistory(initialContent: TranscriptionEditContent) {
  const [content, setContentState] = useState(initialContent);
  const contentRef = useRef(initialContent);
  const pastRef = useRef<TranscriptionEditContent[]>([]);
  const futureRef = useRef<TranscriptionEditContent[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const setContent = useCallback((next: TranscriptionEditContent, recordHistory = false) => {
    if (recordHistory) {
      pastRef.current.push(cloneContent(contentRef.current));
      if (pastRef.current.length > MAX_HISTORY) {
        pastRef.current.shift();
      }
      futureRef.current = [];
    }
    contentRef.current = next;
    setContentState(next);
    syncFlags();
  }, [syncFlags]);

  const replaceContent = useCallback((next: TranscriptionEditContent) => {
    pastRef.current = [];
    futureRef.current = [];
    contentRef.current = next;
    setContentState(next);
    syncFlags();
  }, [syncFlags]);

  const undo = useCallback(() => {
    if (!pastRef.current.length) return;
    futureRef.current.push(cloneContent(contentRef.current));
    const previous = pastRef.current.pop()!;
    contentRef.current = previous;
    setContentState(previous);
    syncFlags();
  }, [syncFlags]);

  const redo = useCallback(() => {
    if (!futureRef.current.length) return;
    pastRef.current.push(cloneContent(contentRef.current));
    const next = futureRef.current.pop()!;
    contentRef.current = next;
    setContentState(next);
    syncFlags();
  }, [syncFlags]);

  const commitSnapshot = useCallback((snapshot: TranscriptionEditContent) => {
    pastRef.current.push(cloneContent(snapshot));
    if (pastRef.current.length > MAX_HISTORY) {
      pastRef.current.shift();
    }
    futureRef.current = [];
    syncFlags();
  }, [syncFlags]);

  return {
    content,
    setContent,
    replaceContent,
    commitSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

function SectionCard({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative z-10 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm ${className}`}>
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
        {description ? <p className="mt-0.5 text-xs text-neutral-500">{description}</p> : null}
      </div>
      <div className="relative z-10" onPointerDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </section>
  );
}

interface SpeakerNamesSectionProps {
  speakers: TranscriptionEditSpeaker[];
  canEdit: boolean;
  newSpeakerName: string;
  onNewSpeakerNameChange: (value: string) => void;
  onAddSpeaker: () => void;
  onSpeakerNameFocus: (speakerId: string) => void;
  onSpeakerNameBlur: (speakerId: string, name: string) => void;
  onSpeakerNameChange: (speakerId: string, name: string) => void;
  onRemoveSpeaker: (speakerId: string) => void;
}

function SpeakerNamesSection({
  speakers,
  canEdit,
  newSpeakerName,
  onNewSpeakerNameChange,
  onAddSpeaker,
  onSpeakerNameFocus,
  onSpeakerNameBlur,
  onSpeakerNameChange,
  onRemoveSpeaker,
}: SpeakerNamesSectionProps) {
  return (
    <SectionCard
      title="Speaker names"
      description="Add the people who may appear in this transcript."
    >
      {speakers.length ? (
        <ul className="mb-3 space-y-2">
          {speakers.map((speaker) => (
            <li
              key={speaker.id}
              className="flex items-center gap-2 rounded-md border border-neutral-100 bg-neutral-50 px-2 py-1.5"
            >
              {canEdit ? (
                <>
                  <input
                    type="text"
                    value={speaker.name}
                    onFocus={() => onSpeakerNameFocus(speaker.id)}
                    onBlur={(event) => onSpeakerNameBlur(speaker.id, event.target.value)}
                    onChange={(event) => onSpeakerNameChange(speaker.id, event.target.value)}
                    className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveSpeaker(speaker.id)}
                    className="rounded p-1 text-neutral-400 hover:bg-white hover:text-red-600"
                    aria-label={`Remove ${speaker.name}`}
                  >
                    <FiX aria-hidden />
                  </button>
                </>
              ) : (
                <span className="text-sm text-neutral-800">{speaker.name}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-neutral-500">No names yet.</p>
      )}

      {canEdit ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newSpeakerName}
            onChange={(event) => onNewSpeakerNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onAddSpeaker();
              }
            }}
            placeholder="New speaker name"
            className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={onAddSpeaker}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm hover:bg-neutral-100"
          >
            <FiPlus aria-hidden />
            Add
          </button>
        </div>
      ) : null}
    </SectionCard>
  );
}

interface SpeakerColorsSectionProps {
  speakers: TranscriptionEditSpeaker[];
  canEdit: boolean;
  onSpeakerColorChange: (speakerId: string, color: string) => void;
}

function SpeakerColorsSection({
  speakers,
  canEdit,
  onSpeakerColorChange,
}: SpeakerColorsSectionProps) {
  return (
    <SectionCard
      title="Speaker colors"
      description="Assign a color to each name for labeling statements."
    >
      {!speakers.length ? (
        <p className="text-xs text-neutral-500">Add speaker names first, then pick colors here.</p>
      ) : (
        <ul className="space-y-2">
          {speakers.map((speaker) => (
            <li
              key={speaker.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-100 bg-neutral-50 px-2 py-2"
            >
              <span
                className="inline-flex min-w-[5rem] items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: speaker.color }}
              >
                {speaker.name}
              </span>
              {canEdit ? (
                <>
                  <input
                    type="color"
                    value={speaker.color}
                    onChange={(event) => onSpeakerColorChange(speaker.id, event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    className="relative z-10 h-9 w-9 shrink-0 cursor-pointer rounded border border-neutral-200 bg-white p-0.5"
                    aria-label={`Pick color for ${speaker.name}`}
                  />
                  <div className="flex flex-wrap gap-1">
                    {SPEAKER_COLORS.map((color) => (
                      <button
                        key={`${speaker.id}-${color}`}
                        type="button"
                        onClick={() => onSpeakerColorChange(speaker.id, color)}
                        className={`h-5 w-5 rounded-full border-2 transition ${
                          speaker.color === color ? 'border-neutral-900 scale-110' : 'border-white shadow-sm'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Set ${speaker.name} to ${color}`}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export default function TranscriptionEditorPanel({
  scheduleId,
  recordingId,
  projectCode,
  initialSegments = [],
  initialFullText,
  isProcessing = false,
  canManage = false,
  onSeek,
  className = '',
}: TranscriptionEditorPanelProps) {
  const seededContent = useMemo(
    () => segmentsToEditContent(initialSegments, initialFullText),
    [initialFullText, initialSegments],
  );

  const {
    content,
    setContent,
    replaceContent,
    commitSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorHistory(seededContent);

  const [syncingSaved, setSyncingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiCanEdit, setApiCanEdit] = useState<boolean | null>(null);
  const canEdit = canManage || apiCanEdit === true;
  const [hasSavedEdit, setHasSavedEdit] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedLineIds, setSelectedLineIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const lineFocusSnapshotRef = useRef<Map<string, TranscriptionEditContent>>(new Map());
  const speakerFocusSnapshotRef = useRef<Map<string, TranscriptionEditContent>>(new Map());
  const hasSeededRef = useRef(false);

  const loadSavedEdit = useCallback(async () => {
    setSyncingSaved(true);
    setError(null);
    const res = await getTranscriptionEdit(scheduleId, recordingId);
    setSyncingSaved(false);

    if (res.error || !res.data) {
      if (res.error && canManage) {
        setError(null);
      } else if (res.error) {
        setError(res.error);
      }
      return;
    }

    setApiCanEdit(res.data.can_edit);
    setHasSavedEdit(Boolean(res.data.edit));

    if (res.data.edit && res.data.content.lines.length) {
      replaceContent(res.data.content);
      hasSeededRef.current = true;
      setIsDirty(false);
    }
  }, [canManage, recordingId, replaceContent, scheduleId]);

  useEffect(() => {
    hasSeededRef.current = false;
  }, [recordingId]);

  useEffect(() => {
    if (hasSavedEdit || isDirty || hasSeededRef.current) return;
    if (!seededContent.lines.length) return;
    replaceContent(seededContent);
    hasSeededRef.current = true;
  }, [hasSavedEdit, isDirty, replaceContent, seededContent]);

  useEffect(() => {
    void loadSavedEdit();
  }, [loadSavedEdit]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!canEdit) return;
      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (isMeta && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
      } else if (event.key === 'Escape') {
        setSelectedLineIds(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canEdit, redo, undo]);

  const speakerById = useMemo(
    () => new Map(content.speakers.map((speaker) => [speaker.id, speaker])),
    [content.speakers],
  );

  const selectedCount = selectedLineIds.size;

  const applyContent = useCallback((next: TranscriptionEditContent, recordHistory = true) => {
    setContent(next, recordHistory);
    setIsDirty(true);
  }, [setContent]);

  const handleAddSpeaker = () => {
    const name = newSpeakerName.trim();
    if (!name) return;

    const speaker: TranscriptionEditSpeaker = {
      id: createSpeakerId(),
      name,
      color: nextSpeakerColor(content.speakers),
    };

    applyContent({
      ...content,
      speakers: [...content.speakers, speaker],
    });
    setNewSpeakerName('');
  };

  const handleSpeakerNameChange = (speakerId: string, name: string) => {
    setContent({
      ...content,
      speakers: content.speakers.map((speaker) => (
        speaker.id === speakerId ? { ...speaker, name } : speaker
      )),
    }, false);
    setIsDirty(true);
  };

  const handleSpeakerNameFocus = (speakerId: string) => {
    speakerFocusSnapshotRef.current.set(speakerId, cloneContent(content));
  };

  const handleSpeakerNameBlur = (speakerId: string, name: string) => {
    const snapshot = speakerFocusSnapshotRef.current.get(speakerId);
    speakerFocusSnapshotRef.current.delete(speakerId);
    if (!snapshot) return;

    const previousName = snapshot.speakers.find((speaker) => speaker.id === speakerId)?.name;
    if (previousName === name) return;

    commitSnapshot(snapshot);
    setIsDirty(true);
  };

  const handleSpeakerColorChange = (speakerId: string, color: string) => {
    applyContent({
      ...content,
      speakers: content.speakers.map((speaker) => (
        speaker.id === speakerId ? { ...speaker, color } : speaker
      )),
    });
  };

  const handleRemoveSpeaker = (speakerId: string) => {
    applyContent({
      ...content,
      speakers: content.speakers.filter((speaker) => speaker.id !== speakerId),
      lines: content.lines.map((line) => (
        line.speaker_id === speakerId ? { ...line, speaker_id: null } : line
      )),
    });
  };

  const toggleLineSelection = (lineId: string) => {
    setSelectedLineIds((current) => {
      const next = new Set(current);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedLineIds(new Set());
  };

  const handleMergeSelected = async () => {
    if (selectedCount < 2) return;

    setActionLoading(true);
    setError(null);
    commitSnapshot(cloneContent(content));

    const lineIds = [...selectedLineIds];
    const res = await mergeTranscriptionLines(scheduleId, recordingId, lineIds, content.speakers);
    setActionLoading(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to merge statements');
      return;
    }

    replaceContent(res.data.content);
    setHasSavedEdit(true);
    setIsDirty(false);
    setSelectedLineIds(new Set());
  };

  const handleAssignSelected = async (speakerId: string) => {
    if (!selectedCount) return;

    setActionLoading(true);
    setError(null);
    commitSnapshot(cloneContent(content));

    const lineIds = [...selectedLineIds];
    const res = await assignTranscriptionSpeaker(
      scheduleId,
      recordingId,
      lineIds,
      speakerId,
      content.speakers,
    );
    setActionLoading(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to assign speaker');
      return;
    }

    replaceContent(res.data.content);
    setHasSavedEdit(true);
    setIsDirty(false);
    setSelectedLineIds(new Set());
  };

  const handleClearSelectedSpeakers = async () => {
    if (!selectedCount) return;

    setActionLoading(true);
    setError(null);
    commitSnapshot(cloneContent(content));

    const next = {
      ...content,
      lines: content.lines.map((line) => (
        selectedLineIds.has(line.id) ? { ...line, speaker_id: null } : line
      )),
    };

    const res = await saveTranscriptionEdit(scheduleId, recordingId, next);
    setActionLoading(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to clear speaker assignments');
      return;
    }

    replaceContent(res.data.content);
    setHasSavedEdit(true);
    setIsDirty(false);
    setSelectedLineIds(new Set());
  };

  const handleLineTextChange = (lineId: string, text: string) => {
    setContent({
      ...content,
      lines: content.lines.map((line) => (line.id === lineId ? { ...line, text } : line)),
    }, false);
    setIsDirty(true);
  };

  const handleLineFocus = (lineId: string) => {
    lineFocusSnapshotRef.current.set(lineId, cloneContent(content));
  };

  const handleLineBlur = (lineId: string, text: string) => {
    const snapshot = lineFocusSnapshotRef.current.get(lineId);
    lineFocusSnapshotRef.current.delete(lineId);
    if (!snapshot) return;

    const previousText = snapshot.lines.find((line) => line.id === lineId)?.text;
    if (previousText === text) return;

    commitSnapshot(snapshot);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await saveTranscriptionEdit(scheduleId, recordingId, content);
    setSaving(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setHasSavedEdit(true);
    setIsDirty(false);
    await loadSavedEdit();
  };

  const handleDownload = async () => {
    const code = projectCode || scheduleId;
    const filename = `${code}-edited-transcription.txt`;
    const localText = formatEditedTranscriptForExport(content);

    if (localText) {
      downloadTextFile(localText, filename);
      return;
    }

    const res = await downloadEditedTranscription(scheduleId, recordingId, filename);
    if (!res.ok) {
      setError(res.error || 'Download failed');
    }
  };

  const getLineHighlight = (lineId: string) => {
    if (selectedLineIds.has(lineId)) {
      return 'border-primary-400 bg-primary-50 ring-2 ring-primary-200';
    }
    return 'border-neutral-200 bg-white hover:border-neutral-300';
  };

  if (!content.lines.length) {
    return (
      <div className={`overflow-y-auto px-4 py-8 text-center text-sm text-neutral-500 ${className}`}>
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <FiLoader className="animate-spin" aria-hidden />
            Transcript will appear here as soon as processing finishes.
          </div>
        ) : (
          'No transcript lines are available to edit yet.'
        )}
      </div>
    );
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div className="shrink-0 border-b border-neutral-200 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-neutral-500">
              {canEdit
                ? 'Select one or more statements, then assign a speaker or merge them.'
                : 'View the annotated transcript.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit ? (
              <>
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                >
                  <FiRotateCcw aria-hidden />
                  Undo
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Y)"
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                >
                  <FiRotateCw aria-hidden />
                  Redo
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-60"
                >
                  {saving ? <FiLoader className="animate-spin" aria-hidden /> : <FiSave aria-hidden />}
                  Save
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => void handleDownload()}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
            >
              <FiDownload aria-hidden />
              Export
            </button>
            {syncingSaved ? (
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                <FiLoader className="animate-spin" aria-hidden />
                Syncing
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="relative z-20 max-h-[42vh] shrink-0 space-y-3 overflow-y-auto overscroll-contain border-b border-neutral-200 bg-neutral-50 p-4 lg:max-h-none lg:p-5"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SpeakerNamesSection
            speakers={content.speakers}
            canEdit={canEdit}
            newSpeakerName={newSpeakerName}
            onNewSpeakerNameChange={setNewSpeakerName}
            onAddSpeaker={handleAddSpeaker}
            onSpeakerNameFocus={handleSpeakerNameFocus}
            onSpeakerNameBlur={handleSpeakerNameBlur}
            onSpeakerNameChange={handleSpeakerNameChange}
            onRemoveSpeaker={handleRemoveSpeaker}
          />
          <SpeakerColorsSection
            speakers={content.speakers}
            canEdit={canEdit}
            onSpeakerColorChange={handleSpeakerColorChange}
          />
        </div>

        {canEdit && selectedCount > 0 ? (
          <SectionCard
            title={`Selected statements (${selectedCount})`}
            description="Assign a color-coded speaker or merge the selected lines into one."
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <FiTag className="shrink-0 text-neutral-400" aria-hidden />
                <span className="text-xs font-medium text-neutral-700">Assign speaker:</span>
                {content.speakers.length ? (
                  content.speakers.map((speaker) => (
                    <button
                      key={speaker.id}
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void handleAssignSelected(speaker.id)}
                      className="rounded-full px-2.5 py-1 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: speaker.color }}
                    >
                      {speaker.name}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-neutral-500">Add speaker names first.</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionLoading || selectedCount < 2}
                  onClick={() => void handleMergeSelected()}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  {actionLoading ? <FiLoader className="animate-spin" aria-hidden /> : <FiGitMerge aria-hidden />}
                  Merge selected
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => void handleClearSelectedSpeakers()}
                  className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Clear speaker assignment
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={clearSelection}
                  className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Clear selection
                </button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <SectionCard
          title="Statements"
          description={canEdit ? 'Use the checkboxes to select statements for assigning or merging.' : undefined}
        >
          <div className="space-y-2">
              {content.lines.map((line) => {
                const speaker = line.speaker_id ? speakerById.get(line.speaker_id) : null;
                const isSelected = selectedLineIds.has(line.id);

                return (
                  <div
                    key={line.id}
                    className={`rounded-md border px-3 py-2 transition ${getLineHighlight(line.id)}`}
                    style={speaker ? { borderLeftWidth: '4px', borderLeftColor: speaker.color } : undefined}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {canEdit ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLineSelection(line.id)}
                          aria-label={`Select statement at ${formatMs(line.start_ms)}`}
                          className="h-4 w-4 rounded border-neutral-300"
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          if (line.start_ms != null) onSeek?.(line.start_ms);
                        }}
                        className="text-xs font-medium text-primary-700 hover:underline"
                      >
                        {formatMs(line.start_ms)}
                      </button>
                      {speaker ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                          style={{ backgroundColor: speaker.color }}
                        >
                          {speaker.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Unassigned</span>
                      )}
                    </div>

                    {canEdit ? (
                      <textarea
                        value={line.text}
                        onFocus={() => handleLineFocus(line.id)}
                        onBlur={(event) => handleLineBlur(line.id, event.target.value)}
                        onChange={(event) => handleLineTextChange(line.id, event.target.value)}
                        rows={Math.min(6, Math.max(2, Math.ceil(line.text.length / 80)))}
                        className="w-full resize-y rounded-md border border-neutral-200 px-2 py-1 text-sm leading-relaxed text-neutral-800"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{line.text}</p>
                    )}
                  </div>
                );
              })}
            </div>
        </SectionCard>
      </div>
    </div>
  );
}
