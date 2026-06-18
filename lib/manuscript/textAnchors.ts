import type { TextQuoteSelector } from '@/lib/api/paperComments';
import type { DiffChange } from '@/lib/api/paperVersions';

const CONTEXT_LEN = 40;

export interface TextNodeIndex {
  node: Text | null;
  start: number;
  end: number;
  isSeparator?: boolean;
}

const BLOCK_TAGS = new Set([
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'LI',
  'TD',
  'TH',
  'TR',
  'SECTION',
]);

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/\u00AD/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function isIndexableTextNode(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return false;
  if (parent.closest('style, script, noscript')) return false;
  return true;
}

function isBlockElement(el: Element): boolean {
  if (BLOCK_TAGS.has(el.tagName)) return true;
  return el.tagName === 'SECTION' && el.classList.contains('docx');
}

function rawOffsetToNormalizedOffset(raw: string, rawOffset: number): number {
  return normalizeText(raw.slice(0, rawOffset)).length;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toFlexibleWhitespacePattern(text: string): string | null {
  const normalized = normalizeText(text).trim();
  if (!normalized) return null;
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  return parts.map(escapeRegex).join('\\s+');
}

function scoreMatch(text: string, start: number, end: number, anchor: TextQuoteSelector): number {
  const prefix = text.slice(Math.max(0, start - CONTEXT_LEN), start);
  const suffix = text.slice(end, Math.min(text.length, end + CONTEXT_LEN));
  let score = 0;
  const normPrefix = normalizeText(anchor.prefix || '');
  const normSuffix = normalizeText(anchor.suffix || '');
  const normCtxPrefix = normalizeText(prefix);
  const normCtxSuffix = normalizeText(suffix);
  if (normPrefix && normCtxPrefix.endsWith(normPrefix)) score += 2;
  if (normSuffix && normCtxSuffix.startsWith(normSuffix)) score += 2;
  if (typeof anchor.start === 'number') {
    score += Math.max(0, 3 - Math.abs(start - anchor.start) / 100);
  }
  return score;
}

function findAllIndices(haystack: string, needle: string): number[] {
  const indices: number[] = [];
  if (!needle) return indices;
  let pos = 0;
  while (pos < haystack.length) {
    const idx = haystack.indexOf(needle, pos);
    if (idx === -1) break;
    indices.push(idx);
    pos = idx + 1;
  }
  return indices;
}

function toBoundaryAwarePattern(text: string): string | null {
  const normalized = normalizeText(text).trim();
  if (!normalized) return null;
  const parts = normalized.split(/(?<=[.!?])(?=[A-Za-z])|(?<=[a-z])(?=[A-Z])/).filter(Boolean);
  if (parts.length <= 1) return null;
  return parts.map(escapeRegex).join('\\s*');
}

function findBoundaryAwareMatch(fullText: string, anchor: TextQuoteSelector) {
  const pattern = toBoundaryAwarePattern(anchor.exact || '');
  if (!pattern) return null;

  const source = normalizeText(fullText);
  const re = new RegExp(pattern, 'g');
  const matches = [...source.matchAll(re)];
  if (!matches.length) return null;

  let chosen = matches[0];
  if (matches.length > 1) {
    let bestScore = -1;
    for (const match of matches) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const nextScore = scoreMatch(source, start, end, anchor);
      if (nextScore > bestScore) {
        bestScore = nextScore;
        chosen = match;
      }
    }
  }

  const start = chosen.index ?? 0;
  return { start, end: start + chosen[0].length };
}

function findFlexibleWhitespaceMatch(fullText: string, anchor: TextQuoteSelector) {
  const pattern = toFlexibleWhitespacePattern(anchor.exact || '');
  if (!pattern) return null;

  const source = normalizeText(fullText);
  const re = new RegExp(pattern, 'g');
  const matches = [...source.matchAll(re)];
  if (!matches.length) return null;

  let chosen = matches[0];
  if (matches.length > 1) {
    let bestScore = -1;
    for (const match of matches) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const nextScore = scoreMatch(source, start, end, anchor);
      if (nextScore > bestScore) {
        bestScore = nextScore;
        chosen = match;
      }
    }
  }

  const start = chosen.index ?? 0;
  const end = start + chosen[0].length;
  return { start, end };
}

export function resolveAnchorInText(
  fullText: string,
  anchor: TextQuoteSelector,
): { start: number; end: number } | null {
  const text = normalizeText(fullText);
  const exact = normalizeText(anchor.exact || '');
  if (!exact) return null;

  const indices = findAllIndices(text, exact);
  if (indices.length === 1) {
    const start = indices[0];
    return { start, end: start + exact.length };
  }

  if (indices.length > 1) {
    let best: { start: number; end: number } | null = null;
    let bestScore = -1;
    for (const start of indices) {
      const end = start + exact.length;
      const nextScore = scoreMatch(text, start, end, anchor);
      if (nextScore > bestScore) {
        bestScore = nextScore;
        best = { start, end };
      }
    }
    if (best) return best;
  }

  const normPrefix = normalizeText(anchor.prefix || '');
  const normSuffix = normalizeText(anchor.suffix || '');
  const composite = `${normPrefix}${exact}${normSuffix}`;
  if (composite.length > exact.length) {
    const compositeIdx = text.indexOf(composite);
    if (compositeIdx !== -1) {
      const start = compositeIdx + normPrefix.length;
      return { start, end: start + exact.length };
    }
  }

  const flexible = findFlexibleWhitespaceMatch(fullText, anchor);
  if (flexible) return flexible;

  const boundary = findBoundaryAwareMatch(fullText, anchor);
  if (boundary) return boundary;

  return null;
}

export function buildTextNodeIndex(container: HTMLElement): { nodes: TextNodeIndex[]; fullText: string } {
  const nodes: TextNodeIndex[] = [];
  let idx = 0;

  const appendSeparator = () => {
    if (idx === 0) return;
    if (nodes[nodes.length - 1]?.isSeparator) return;
    nodes.push({ node: null, start: idx, end: idx + 1, isSeparator: true });
    idx += 1;
  };

  const appendText = (node: Text) => {
    const normalized = normalizeText(node.nodeValue || '');
    if (!normalized) return;
    nodes.push({ node, start: idx, end: idx + normalized.length });
    idx += normalized.length;
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (isIndexableTextNode(node)) appendText(node as Text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    if (el.matches('style, script, noscript')) return;
    if (el.tagName === 'BR') {
      appendSeparator();
      return;
    }

    if (isBlockElement(el)) appendSeparator();

    for (const child of el.childNodes) {
      walk(child);
    }
  };

  walk(container);

  const fullText = nodes
    .map((entry) => (entry.isSeparator ? '\n' : normalizeText(entry.node?.nodeValue || '')))
    .join('');

  return { nodes, fullText };
}

export function offsetFromRange(
  range: Range,
  nodes: TextNodeIndex[],
): { start: number; end: number } | null {
  const startNode = range.startContainer;
  const endNode = range.endContainer;

  let start: number | null = null;
  let end: number | null = null;

  for (const entry of nodes) {
    if (entry.isSeparator || !entry.node) continue;
    if (entry.node === startNode) {
      start = entry.start + rawOffsetToNormalizedOffset(entry.node.nodeValue || '', range.startOffset);
    }
    if (entry.node === endNode) {
      end = entry.start + rawOffsetToNormalizedOffset(entry.node.nodeValue || '', range.endOffset);
    }
  }

  if (start == null || end == null || end <= start) return null;
  return { start, end };
}

export function buildTextQuoteSelector(fullText: string, start: number, end: number): TextQuoteSelector {
  const text = normalizeText(fullText);
  const safeStart = Math.max(0, Math.min(start, text.length));
  const safeEnd = Math.max(safeStart, Math.min(end, text.length));
  const exact = text.slice(safeStart, safeEnd);
  const prefix = text.slice(Math.max(0, safeStart - CONTEXT_LEN), safeStart);
  const suffix = text.slice(safeEnd, Math.min(text.length, safeEnd + CONTEXT_LEN));
  return {
    type: 'TextQuoteSelector',
    exact,
    prefix,
    suffix,
    start: safeStart,
    end: safeEnd,
  };
}

export function wrapTextRange(
  container: HTMLElement,
  start: number,
  end: number,
  className: string,
  dataAttrs?: Record<string, string>,
) {
  const { nodes } = buildTextNodeIndex(container);
  const textNodes = nodes.filter((entry) => !entry.isSeparator && entry.node);
  if (!textNodes.length) return;

  let startNodeIndex = -1;
  for (let i = 0; i < textNodes.length; i++) {
    if (start >= textNodes[i].start && start < textNodes[i].end) {
      startNodeIndex = i;
      break;
    }
  }
  if (startNodeIndex === -1) return;

  let endNodeIndex = startNodeIndex;
  while (endNodeIndex < textNodes.length && end > textNodes[endNodeIndex].end) endNodeIndex++;
  if (endNodeIndex >= textNodes.length) return;

  const startEntry = textNodes[startNodeIndex];
  const endEntry = textNodes[endNodeIndex];
  const startNode = startEntry.node as Text;
  const endNode = endEntry.node as Text;

  const startRaw = startNode.nodeValue || '';
  const endRaw = endNode.nodeValue || '';
  const startOffset = findRawOffsetForNormalizedOffset(startRaw, start - startEntry.start);
  const endOffset = findRawOffsetForNormalizedOffset(endRaw, end - endEntry.start);

  const range = document.createRange();
  try {
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    const wrapper = document.createElement('mark');
    wrapper.className = className;
    if (dataAttrs) {
      Object.entries(dataAttrs).forEach(([key, value]) => {
        wrapper.dataset[key] = value;
      });
    }
    range.surroundContents(wrapper);
  } catch {
    // surroundContents may throw for overlapping or partial element boundaries
  }
}

function findRawOffsetForNormalizedOffset(raw: string, normalizedOffset: number): number {
  for (let rawOffset = 0; rawOffset <= raw.length; rawOffset++) {
    if (rawOffsetToNormalizedOffset(raw, rawOffset) >= normalizedOffset) {
      return rawOffset;
    }
  }
  return raw.length;
}

export function applyDiffHighlights(
  container: HTMLElement,
  changes: DiffChange[],
  mode: 'current' | 'previous',
) {
  const { fullText } = buildTextNodeIndex(container);
  if (!fullText) return;

  const ranges: { start: number; end: number; type: 'added' | 'removed' }[] = [];
  let pointer = 0;

  for (const part of changes) {
    if (mode === 'current' && part.removed) continue;
    if (mode === 'previous' && part.added) continue;
    const val = part.value || '';
    if (!val) continue;
    const startIndex = fullText.indexOf(val, pointer);
    if (startIndex === -1) {
      const alt = fullText.indexOf(val);
      if (alt === -1) continue;
      pointer = alt + val.length;
      ranges.push({
        start: alt,
        end: alt + val.length,
        type: part.added ? 'added' : part.removed ? 'removed' : 'added',
      });
    } else {
      ranges.push({
        start: startIndex,
        end: startIndex + val.length,
        type: part.added ? 'added' : part.removed ? 'removed' : 'added',
      });
      pointer = startIndex + val.length;
    }
  }

  ranges.sort((a, b) => b.start - a.start);
  for (const r of ranges) {
    const className =
      r.type === 'added'
        ? 'bg-success-100 text-success-800 decoration-success-400'
        : 'bg-error-100 text-error-800 line-through decoration-error-400';
    wrapTextRange(container, r.start, r.end, className);
  }
}
