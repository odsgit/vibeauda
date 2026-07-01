type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

const PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;

function isLocalhost(): boolean {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

let initialized = false;

/** Loads the Microsoft Clarity tracking script. Skipped on localhost or when VITE_CLARITY_PROJECT_ID is unset. */
export function initClarity(): void {
  if (initialized || !PROJECT_ID || isLocalhost()) return;
  initialized = true;

  const clarity: ClarityFn = (...args: unknown[]) => {
    clarity.q = clarity.q ?? [];
    clarity.q.push(args);
  };
  window.clarity = clarity;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${PROJECT_ID}`;
  document.head.appendChild(script);
}
