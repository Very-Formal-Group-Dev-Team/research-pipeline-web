/**
 * Jitsi theme tokens aligned with Archivum dashboard radii (see app/globals.css `.dashboard-ui`).
 * `shape.borderRadius` drives the React/MUI-based Jitsi chrome (toolbar, prejoin, dialogs).
 */
export const ARCHIVUM_JITSI_BORDER_RADIUS_PX = 2;

export const archivumJitsiCustomTheme = {
  shape: {
    borderRadius: ARCHIVUM_JITSI_BORDER_RADIUS_PX,
  },
} as const;

export const archivumJitsiConfigOverwrite = {
  prejoinPageEnabled: true,
  startWithAudioMuted: false,
  startWithVideoMuted: false,
  disableDeepLinking: true,
  hideConferenceSubject: true,
  hideDisplayName: true,
  hideConferenceTimer: true,
  disableReactions: false,
  disableRaiseHand: false,
  toolbarButtons: [],
  toolbarConfig: {
    alwaysVisible: false,
    initialTimeout: 0,
  },
  /** Stage pinning breaks Archivum's left-overlay filmstrip + full-width main video layout. */
  filmstrip: {
    disableStageFilmstrip: true,
  },
  customTheme: archivumJitsiCustomTheme,
} as const;

export const archivumJitsiInterfaceConfigOverwrite = {
  SHOW_JITSI_WATERMARK: false,
  SHOW_WATERMARK_FOR_GUESTS: false,
  MOBILE_APP_PROMO: false,
  TOOLBAR_BUTTONS: [],
  TOOLBAR_ALWAYS_VISIBLE: false,
  INITIAL_TOOLBAR_TIMEOUT: 0,
  /** Native gauge at top-center — Archivum control bar has Performance instead. */
  VIDEO_QUALITY_LABEL_DISABLED: true,
} as const;

/** Height of the Archivum meeting control bar — keep Jitsi filmstrip below this. */
export const MEETING_CONTROL_BAR_HEIGHT = '4.25rem';
