/** Registers the PWA service worker in production builds only. */
export const registerServiceWorker = () => {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* registration failures are non-fatal */
    });
  });
};
