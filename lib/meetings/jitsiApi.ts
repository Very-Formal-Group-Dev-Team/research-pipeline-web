export interface JitsiMediaState {
  audioMuted: boolean;
  videoMuted: boolean;
}

export type JitsiMeetApi = JitsiMeetExternalAPI;

export function toggleJitsiAudio(api: JitsiMeetApi | null) {
  api?.executeCommand('toggleAudio');
}

export function toggleJitsiVideo(api: JitsiMeetApi | null) {
  api?.executeCommand('toggleVideo');
}

export function toggleJitsiChat(api: JitsiMeetApi | null) {
  api?.executeCommand('toggleChat');
}

export function toggleJitsiShareScreen(api: JitsiMeetApi | null) {
  api?.executeCommand('toggleShareScreen');
}

export function toggleJitsiTileView(api: JitsiMeetApi | null) {
  api?.executeCommand('toggleTileView');
}

export function setJitsiParticipantsPaneOpen(api: JitsiMeetApi | null, open: boolean) {
  api?.executeCommand('toggleParticipantsPane', open);
}

/** Jitsi's API treats a missing arg as "close" — always pass an explicit boolean. */
export async function toggleJitsiParticipantsPane(api: JitsiMeetApi | null) {
  if (!api) return;

  let isOpen = false;
  if (typeof api.isParticipantsPaneOpen === 'function') {
    try {
      isOpen = Boolean(await api.isParticipantsPaneOpen());
    } catch {
      isOpen = false;
    }
  }

  setJitsiParticipantsPaneOpen(api, !isOpen);
}

export function hangUpJitsi(api: JitsiMeetApi | null) {
  api?.executeCommand('hangup');
}

export function setJitsiAudioOnly(api: JitsiMeetApi | null, enabled: boolean) {
  api?.executeCommand('setAudioOnly', enabled);
}

export function setJitsiVideoQuality(api: JitsiMeetApi | null, maxFrameHeight: number) {
  api?.executeCommand('setVideoQuality', maxFrameHeight);
}

export function toggleJitsiRaiseHand(api: JitsiMeetApi | null) {
  api?.executeCommand('toggleRaiseHand');
}

/** Jitsi reaction keys — must match react/features/reactions/constants.ts */
export const JITSI_REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Thumbs up' },
  { key: 'clap', emoji: '👏', label: 'Clap' },
  { key: 'laugh', emoji: '😀', label: 'Laugh' },
  { key: 'surprised', emoji: '😮', label: 'Surprised' },
  { key: 'boo', emoji: '🙁', label: 'Boo' },
  { key: 'silence', emoji: '😶', label: 'Silence' },
  { key: 'love', emoji: '💖', label: 'Love' },
] as const;

export type JitsiReactionKey = (typeof JITSI_REACTIONS)[number]['key'];

const ARCHIVUM_JITSI_MESSAGE_SOURCE = 'archivum-meeting';

function getJitsiIframeTargetOrigin(api: JitsiMeetApi): string {
  try {
    return new URL(api.getIFrame().src).origin;
  } catch {
    return '*';
  }
}

/**
 * Sends a reaction into the Jitsi iframe. Jitsi has no External API command for this;
 * body.html listens for this postMessage and dispatches the reactions Redux actions.
 */
export function sendJitsiReaction(api: JitsiMeetApi | null, reaction: JitsiReactionKey) {
  if (!api) return;

  const iframeWindow = api.getIFrame()?.contentWindow;
  if (!iframeWindow) return;

  iframeWindow.postMessage(
    {
      source: ARCHIVUM_JITSI_MESSAGE_SOURCE,
      command: 'send-reaction',
      reaction,
    },
    getJitsiIframeTargetOrigin(api),
  );
}

/**
 * Opens Jitsi's settings dialog. The External API has no settings command;
 * body.html listens for this postMessage and triggers the native settings UI.
 */
export function openJitsiSettings(api: JitsiMeetApi | null) {
  if (!api) return;

  const iframeWindow = api.getIFrame()?.contentWindow;
  if (!iframeWindow) return;

  const message = {
    source: ARCHIVUM_JITSI_MESSAGE_SOURCE,
    command: 'open-settings',
  } as const;

  const targetOrigin = getJitsiIframeTargetOrigin(api);
  iframeWindow.postMessage(message, targetOrigin);

  // Retry while the iframe store finishes booting.
  window.setTimeout(() => iframeWindow.postMessage(message, targetOrigin), 150);
  window.setTimeout(() => iframeWindow.postMessage(message, targetOrigin), 400);
}
