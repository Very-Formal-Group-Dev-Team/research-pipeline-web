'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/Button';
import {
  crossReferenceStudies,
  type CrossReferenceScopeField,
  type CrossReferenceSort,
  type CrossReferenceStudy,
} from '@/lib/api/projects';
import {
  formSelectResponsiveClassName,
  projectDetailMetadataTextClassName,
} from '@/lib/utils/formControls';

const PER_PAGE = 20;
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_FROM_YEAR = String(CURRENT_YEAR - 5);
const SCOPE_CONFIDENCE_THRESHOLD = 0.5;

const SORT_OPTIONS: Array<{ value: CrossReferenceSort; label: string }> = [
  { value: 'relevance_score:desc', label: 'Most relevant' },
  { value: 'publication_date:desc', label: 'Newest first' },
  { value: 'publication_date:asc', label: 'Oldest first' },
];

const FOUR_DIGIT_YEAR_PATTERN = /^\d{4}$/;

const CROSS_REF_CONTROL_CLASS = [
  projectDetailMetadataTextClassName,
  'h-9 !min-h-0 !py-1.5 !px-3 !text-sm !leading-snug md:h-10 md:!py-2 md:!text-md md:!leading-normal',
  'shrink-0',
].join(' ');

const CROSS_REF_SORT_SELECT_CLASS = [
  formSelectResponsiveClassName,
  CROSS_REF_CONTROL_CLASS,
  '!w-[10.5rem] !pr-8 bg-[length:0.875rem_0.875rem] bg-[right_0.5rem_center]',
].join(' ');

const CROSS_REF_YEAR_GROUP_CLASS = [
  CROSS_REF_CONTROL_CLASS,
  'inline-flex items-center gap-1.5 !py-0 !px-2.5 border border-neutral-300 rounded-lg bg-white',
  'focus-within:outline-none focus-within:shadow-[0_0_12px_rgba(44,62,107,0.2)]',
  'has-[:disabled]:bg-neutral-100',
].join(' ');

const CROSS_REF_YEAR_PREFIX_CLASS = 'shrink-0 text-sm text-neutral-500 md:text-md';

const CROSS_REF_YEAR_INNER_INPUT_CLASS = [
  projectDetailMetadataTextClassName,
  'w-[4.25rem] min-w-[4.25rem] border-0 bg-transparent p-0 text-sm tabular-nums',
  'focus:outline-none focus:ring-0 md:text-md',
  'placeholder:text-neutral-400',
  'disabled:cursor-not-allowed disabled:text-neutral-600',
].join(' ');

const CROSS_REF_SEARCH_BUTTON_CLASS =
  'h-9 !min-h-0 !py-0 !px-3 !text-sm !leading-snug md:h-10 md:!px-4 md:!text-md md:!leading-normal';

function sanitizeYearInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

function validateYearInput(value: string, label: string, { allowEmpty = true } = {}) {
  const trimmed = value.trim();
  if (!trimmed) {
    return allowEmpty ? null : `${label} is required`;
  }
  if (!FOUR_DIGIT_YEAR_PATTERN.test(trimmed)) {
    return `${label} must be a 4-digit year`;
  }
  return null;
}

function studyDoiUrl(doi?: string): string | null {
  if (!doi) return null;
  return doi.startsWith('http')
    ? doi
    : `https://doi.org/${doi.replace(/^https?:\/\/doi.org\//, '')}`;
}

type CrossRefFilters = {
  sort: CrossReferenceSort;
  fromYear: string;
  toYear: string;
};

const INITIAL_CROSS_REF_FILTERS: CrossRefFilters = {
  sort: 'relevance_score:desc',
  fromYear: DEFAULT_FROM_YEAR,
  toYear: String(CURRENT_YEAR),
};

function filtersMatch(a: CrossRefFilters, b: CrossRefFilters) {
  return a.sort === b.sort && a.fromYear === b.fromYear && a.toYear === b.toYear;
}

const SKELETON_TITLE_WIDTHS = ['w-[92%]', 'w-[78%]', 'w-[85%]', 'w-[70%]', 'w-[88%]', 'w-[80%]'];

const CROSS_REF_SHIMMER_LINE_CLASS =
  'rounded bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-shimmer';

function CrossRefShimmerLine({ className = '' }: { className?: string }) {
  return <div className={`${CROSS_REF_SHIMMER_LINE_CLASS} ${className}`.trim()} aria-hidden />;
}

function CrossReferenceMetadataSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1" aria-hidden>
      <CrossRefShimmerLine className="h-3.5 w-12" />
      <CrossRefShimmerLine className="h-3.5 w-44 max-w-[55%]" />
      <span className="text-neutral-300">·</span>
      <CrossRefShimmerLine className="h-3.5 w-28" />
    </div>
  );
}

function CrossReferenceStudyCardSkeleton({ index }: { index: number }) {
  const titleWidth = SKELETON_TITLE_WIDTHS[index % SKELETON_TITLE_WIDTHS.length];
  const showSecondTitleLine = index % 3 !== 1;

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-3">
      <div className="space-y-2">
        <CrossRefShimmerLine className={`h-4 ${titleWidth}`} />
        {showSecondTitleLine ? <CrossRefShimmerLine className="h-4 w-[58%]" /> : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <CrossRefShimmerLine className="h-3 w-[5.5rem]" />
        <span className="text-[10px] text-neutral-300" aria-hidden>
          ·
        </span>
        <CrossRefShimmerLine className="h-3 w-16" />
        <span className="text-[10px] text-neutral-300" aria-hidden>
          ·
        </span>
        <CrossRefShimmerLine className="h-3 w-24" />
      </div>
      {index % 2 === 0 ? <CrossRefShimmerLine className="mt-2 h-3 w-36 max-w-full" /> : null}
    </div>
  );
}

function CrossReferenceStudiesSkeletonList({
  count = 6,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`space-y-2 ${className}`}
      aria-busy="true"
      aria-label="Loading related studies"
    >
      {Array.from({ length: count }, (_, index) => (
        <CrossReferenceStudyCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
}

function CrossReferenceStudyCard({ study }: { study: CrossReferenceStudy }) {
  const authorNames = (study.authorships || [])
    .map((a) => a?.author?.display_name)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
  const doiUrl = studyDoiUrl(study.doi);

  return (
    <div className="rounded-lg border border-neutral-300 bg-white p-3">
      <p className="text-sm font-medium text-neutral-900">{study.display_name}</p>
      <p className="mt-1 text-xs text-neutral-600">
        {authorNames || 'Unknown authors'}
        {study.publication_date ? ` · ${study.publication_date}` : ''}
        {study.primary_location?.source?.display_name
          ? ` · ${study.primary_location.source.display_name}`
          : ''}
      </p>
      {doiUrl ? (
        <a
          href={doiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block break-all text-xs text-primary-600 underline"
        >
          {doiUrl}
        </a>
      ) : null}
    </div>
  );
}

type CrossReferenceStudiesPanelProps = {
  projectId: string;
  predictedFieldPredictions?: CrossReferenceScopeField[];
};

export default function CrossReferenceStudiesPanel({
  projectId,
  predictedFieldPredictions = [],
}: CrossReferenceStudiesPanelProps) {
  const [studies, setStudies] = useState<CrossReferenceStudy[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState<CrossReferenceSort>('relevance_score:desc');
  const [fromYear, setFromYear] = useState(DEFAULT_FROM_YEAR);
  const [toYear, setToYear] = useState(String(CURRENT_YEAR));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<CrossRefFilters>(INITIAL_CROSS_REF_FILTERS);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const scopedFields = useMemo(() => {
    const seen = new Set<string>();
    return predictedFieldPredictions
      .filter((field) => field && typeof field.code === 'string')
      .map((field) => ({
        code: String(field.code || '').trim(),
        label: String(field.label || '').trim(),
        confidence: typeof field.confidence === 'number' ? field.confidence : Number(field.confidence) || 0,
      }))
      .filter((field) => field.code && field.confidence >= SCOPE_CONFIDENCE_THRESHOLD)
      .filter((field) => {
        if (seen.has(field.code)) return false;
        seen.add(field.code);
        return true;
      });
  }, [predictedFieldPredictions]);

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean) => {
      const fetchId = ++fetchIdRef.current;
      if (targetPage === 1) {
        setLoading(true);
        setError(null);
      } else {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      const res = await crossReferenceStudies(projectId, {
        page: targetPage,
        perPage: PER_PAGE,
        sort,
        fromYear: fromYear || undefined,
        toYear: toYear || undefined,
        predictedFields: scopedFields.map((field) => ({
          code: field.code,
          confidence: field.confidence,
        })),
        predictedLabels: scopedFields.length ? scopedFields.map((field) => field.code) : undefined,
        confidenceThreshold: SCOPE_CONFIDENCE_THRESHOLD,
      });

      if (fetchId !== fetchIdRef.current) return;

      if (res.error || !res.data) {
        setError(res.error || 'Failed to fetch cross-referenced studies');
        setLoading(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
        return;
      }

      setQuery(res.data.query);
      setTotal(res.data.total);
      setPage(res.data.page);
      setHasMore(res.data.hasMore);
      setStudies((prev) => (append ? [...prev, ...res.data!.studies] : res.data!.studies));
      if (targetPage === 1) {
        setAppliedFilters({ sort, fromYear, toYear });
      }
      setLoading(false);
      loadingMoreRef.current = false;
      setLoadingMore(false);
    },
    [projectId, sort, fromYear, toYear, scopedFields],
  );

  const handleSearch = () => {
    const fromYearError = validateYearInput(fromYear, 'From year');
    const toYearError = validateYearInput(toYear, 'To year');
    const validationError = fromYearError || toYearError;

    if (validationError) {
      setError(validationError);
      return;
    }

    if (fromYear.trim() && toYear.trim()) {
      const from = parseInt(fromYear.trim(), 10);
      const to = parseInt(toYear.trim(), 10);
      if (from > to) {
        setError('From year cannot be after to year');
        return;
      }
    }

    setStudies([]);
    setQuery(null);
    setError(null);
    void fetchPage(1, false);
  };

  const loadMore = useCallback(() => {
    if (loading || loadingMoreRef.current || !hasMore || page < 1) return;
    void fetchPage(page + 1, true);
  }, [loading, hasMore, page, fetchPage]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasMore || studies.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { root, rootMargin: '120px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, studies.length]);

  const currentFilters = useMemo(
    () => ({ sort, fromYear, toYear }),
    [sort, fromYear, toYear],
  );
  const filtersDirty = !filtersMatch(currentFilters, appliedFilters);

  return (
    <div className="mt-6 border-t border-neutral-300 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h3 className="shrink-0 font-serif text-lg font-semibold text-eerieBlack">Cross-referencing</h3>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <select
            id="cross-ref-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as CrossReferenceSort)}
            disabled={loading}
            aria-label="Sort by"
            className={CROSS_REF_SORT_SELECT_CLASS}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className={CROSS_REF_YEAR_GROUP_CLASS}>
            <label htmlFor="cross-ref-from-year" className={CROSS_REF_YEAR_PREFIX_CLASS}>
              From
            </label>
            <input
              id="cross-ref-from-year"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder={DEFAULT_FROM_YEAR}
              value={fromYear}
              onChange={(e) => setFromYear(sanitizeYearInput(e.target.value))}
              disabled={loading}
              className={CROSS_REF_YEAR_INNER_INPUT_CLASS}
            />
          </div>

          <span className="shrink-0 text-neutral-400" aria-hidden>
            —
          </span>

          <div className={CROSS_REF_YEAR_GROUP_CLASS}>
            <label htmlFor="cross-ref-to-year" className={CROSS_REF_YEAR_PREFIX_CLASS}>
              To
            </label>
            <input
              id="cross-ref-to-year"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder={String(CURRENT_YEAR)}
              value={toYear}
              onChange={(e) => setToYear(sanitizeYearInput(e.target.value))}
              disabled={loading}
              className={CROSS_REF_YEAR_INNER_INPUT_CLASS}
            />
          </div>

          <span className="relative inline-flex shrink-0">
            <Button
              size="sm"
              variant="primary"
              onClick={handleSearch}
              disabled={loading}
              className={CROSS_REF_SEARCH_BUTTON_CLASS}
              aria-label={
                filtersDirty && !loading
                  ? 'Search related studies. Sort or filter changes are not applied yet.'
                  : 'Search related studies'
              }
            >
              {loading ? 'Searching...' : 'Search related studies'}
            </Button>
            {filtersDirty && !loading ? (
              <span
                className="pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white"
                title="Sort or filter changed — click to apply"
                aria-hidden
              />
            ) : null}
          </span>
        </div>
      </div>

      {scopedFields.length > 0 ? (
        <p className="mt-2 text-xs text-neutral-600 md:text-sm">
          Scoped to:{' '}
          {scopedFields
            .map((field) => `${field.label} (${Math.round(field.confidence * 100)}%)`)
            .join(', ')}
        </p>
      ) : null}

      {loading || query !== null || error ? (
        <div className="mt-3 space-y-1">
          {loading && query === null ? (
            <CrossReferenceMetadataSkeleton />
          ) : null}
          {query !== null ? (
            <p className="text-sm text-neutral-500 md:text-md">
              Query: {query}
              {' · '}
              Showing {studies.length} of {total.toLocaleString()}
            </p>
          ) : null}
          {error ? <p className="text-sm text-archivumRed">{error}</p> : null}
        </div>
      ) : null}

      {loading || query !== null ? (
        <div className="mt-3 space-y-3">
          {loading && studies.length === 0 ? (
            <CrossReferenceStudiesSkeletonList
              count={6}
              className="h-96 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50/50 p-2"
            />
          ) : studies.length > 0 ? (
            <div
              ref={scrollRef}
              className="h-96 space-y-2 overflow-y-auto overscroll-contain rounded-md border border-neutral-200 bg-neutral-50/50 p-2"
              aria-label="Cross-referenced studies"
              aria-busy={loadingMore}
            >
              {studies.map((study, index) => (
                <CrossReferenceStudyCard
                  key={study.id || `${study.display_name}-${index}`}
                  study={study}
                />
              ))}
              {loadingMore ? <CrossReferenceStudiesSkeletonList count={2} /> : null}
              <div ref={sentinelRef} className="h-1" aria-hidden />
              {!hasMore && !loadingMore ? (
                <p className="py-2 text-center text-xs text-neutral-500">All results loaded</p>
              ) : null}
            </div>
          ) : query !== null && !loading ? (
            <p className="text-sm text-neutral-500">No studies found for current keywords and filters.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
