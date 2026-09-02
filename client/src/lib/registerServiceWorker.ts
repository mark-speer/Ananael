/**
 * Service worker registration for the installable PWA shell.
 * No-op in unsupported environments (older browsers, some in-app webviews).
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline shell just won't be available — the app still works online */
    });
  });
}
