import * as DOCX from 'docx-preview';
import { getPaperVersionDownloadUrl } from '@/lib/api/paperVersions';

export const DOCX_PREVIEW_CONTAINER_CLASS = 'docx-preview';
export const DOCX_PREVIEW_VIEWPORT_CLASS = 'docx-preview-viewport';

export const DOCX_PREVIEW_STYLES = `
  .${DOCX_PREVIEW_VIEWPORT_CLASS} {
    width: 100%;
    min-width: 0;
    overflow: visible;
  }

  .${DOCX_PREVIEW_CONTAINER_CLASS} {
    width: 100%;
    min-width: 0;
    margin: 0 auto;
  }

  .${DOCX_PREVIEW_CONTAINER_CLASS} .docx-wrapper {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto;
    padding: 0 !important;
    background: transparent !important;
  }

  .${DOCX_PREVIEW_CONTAINER_CLASS} .docx-wrapper > section.docx {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
    background: white;
    margin: 0 auto 1.5rem !important;
    padding: 28px 32px !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    page-break-after: always;
    page-break-inside: avoid;
  }

  @media (max-width: 767px) {
    .${DOCX_PREVIEW_CONTAINER_CLASS} .docx-wrapper > section.docx {
      padding: 12px 6px !important;
      margin-bottom: 0.75rem !important;
    }
  }

  .${DOCX_PREVIEW_CONTAINER_CLASS} .docx-wrapper > section.docx:last-child {
    page-break-after: auto;
    margin-bottom: 0 !important;
  }

  .${DOCX_PREVIEW_CONTAINER_CLASS} .docx {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }

  .docx-preview-scale-host {
    transform-origin: top left;
    margin: 0;
    width: 100%;
    max-width: 100%;
  }
`;

export const DOCX_PREVIEW_SCROLL_CLASS =
  'overflow-y-auto overflow-x-hidden px-1 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4';

export const HTML_PREVIEW_MOBILE_CLASS =
  'max-md:text-[13px] max-md:leading-relaxed max-md:[&_p]:!text-[13px] max-md:[&_li]:!text-[13px] max-md:[&_td]:!text-[13px] max-md:[&_th]:!text-[13px] max-md:px-0.5';

const DOCX_RENDER_OPTIONS = {
  inWrapper: true,
  ignoreWidth: true,
  ignoreHeight: false,
  breakPages: true,
  ignoreLastRenderedPageBreak: true,
};

function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)session_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Scale docx content to fill the scroll container width. */
export function scaleDocxPreviewToFit(
  viewport: HTMLElement,
  scrollContainer?: HTMLElement,
) {
  const host = viewport.querySelector('.docx-preview-scale-host') as HTMLElement | null;
  const wrapper = viewport.querySelector('.docx-wrapper') as HTMLElement | null;
  const target = host ?? wrapper;
  if (!target) return;

  target.style.transform = '';
  target.style.width = '';
  if (host) {
    host.style.height = '';
    host.style.width = '100%';
  }

  const widthSource = scrollContainer ?? viewport;
  const containerWidth = widthSource.clientWidth;
  if (containerWidth <= 0) return;

  const contentWidth = target.scrollWidth || target.getBoundingClientRect().width;
  if (contentWidth <= 0) return;

  const scale = Math.min(1.25, containerWidth / contentWidth);

  if (Math.abs(scale - 1) < 0.005) {
    target.style.transform = '';
    if (host) host.style.height = '';
    return;
  }

  target.style.transform = `scale(${scale})`;
  target.style.transformOrigin = 'top left';

  if (host) {
    const naturalHeight = target.offsetHeight || target.getBoundingClientRect().height;
    host.style.height = `${Math.ceil(naturalHeight * scale)}px`;
    host.style.width = `${Math.ceil(contentWidth * scale)}px`;
  }
}

export function observeDocxPreviewResize(
  element: HTMLElement,
  onResize: () => void,
): () => void {
  if (typeof ResizeObserver === 'undefined') {
    const handleResize = () => onResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }

  const observer = new ResizeObserver(() => onResize());
  observer.observe(element);
  return () => observer.disconnect();
}

export async function renderDocxPreview(
  container: HTMLElement,
  projectId: string,
  versionId: string,
): Promise<HTMLElement> {
  container.innerHTML = '';

  const styleEl = document.createElement('style');
  styleEl.textContent = DOCX_PREVIEW_STYLES;
  container.appendChild(styleEl);

  const viewport = document.createElement('div');
  viewport.className = DOCX_PREVIEW_VIEWPORT_CLASS;

  const scaleHost = document.createElement('div');
  scaleHost.className = 'docx-preview-scale-host';

  const body = document.createElement('div');
  body.className = DOCX_PREVIEW_CONTAINER_CLASS;
  scaleHost.appendChild(body);
  viewport.appendChild(scaleHost);
  container.appendChild(viewport);

  const token = getSessionToken();
  const url = getPaperVersionDownloadUrl(projectId, versionId);
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    throw new Error('Failed to fetch document');
  }

  const blob = await res.blob();

  await DOCX.renderAsync(blob, body, null, DOCX_RENDER_OPTIONS);

  requestAnimationFrame(() => {
    scaleDocxPreviewToFit(viewport);
  });

  return viewport;
}

export function isDocxFileName(fileName?: string): boolean {
  return fileName?.toLowerCase().endsWith('.docx') ?? false;
}
