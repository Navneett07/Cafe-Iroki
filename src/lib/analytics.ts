/**
 * Google Analytics (GA4) ready analytics abstraction.
 *
 * Enabled only when VITE_GA_ID is set AND VITE_ENABLE_ANALYTICS !== 'false'.
 * Loads gtag.js lazily; falls back to no-op otherwise. Swap the provider by
 * editing this file only — call sites stay identical.
 */
const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
const ENABLED = Boolean(GA_ID) && import.meta.env.VITE_ENABLE_ANALYTICS !== 'false' && import.meta.env.PROD;

type GtagArgs = [string, ...unknown[]];
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

export const initAnalytics = () => {
  if (!ENABLED || window.gtag) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: GtagArgs) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID as string, { send_page_view: false });
};

export const analytics = {
  enabled: ENABLED,
  /** Track a SPA page view (call on route change). */
  pageView(path: string) {
    if (ENABLED) window.gtag?.('event', 'page_view', { page_path: path });
  },
  /** Track a custom event. */
  track(event: string, params?: Record<string, unknown>) {
    if (ENABLED) window.gtag?.('event', event, params);
  },
};
