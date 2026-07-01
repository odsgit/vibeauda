declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let initialized = false;

/** Loads gtag.js and wires up window.gtag. No-ops if VITE_GA_MEASUREMENT_ID is unset. */
export function initAnalytics(): void {
  if (initialized || !MEASUREMENT_ID) return;
  initialized = true;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

function sendEvent(name: string, params?: Record<string, unknown>): void {
  if (!MEASUREMENT_ID) return;
  window.gtag?.('event', name, params);
}

export function trackUpload(params?: { fileType?: string }): void {
  sendEvent('track_upload', params?.fileType ? { file_type: params.fileType } : undefined);
}

export function trackStemSeparationComplete(params?: { durationMs?: number }): void {
  sendEvent(
    'stem_separation_complete',
    params?.durationMs !== undefined ? { duration_ms: params.durationMs } : undefined,
  );
}

export function trackKeyTranspose(delta: number): void {
  sendEvent('key_transpose', { delta });
}

export function trackPartMuteToggle(part: string, muted: boolean): void {
  sendEvent('part_mute_toggle', { part, muted });
}

export function trackSheetViewSwitch(part: string): void {
  sendEvent('sheet_view_switch', { part });
}
