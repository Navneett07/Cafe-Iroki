/**
 * Sentry-ready error logging abstraction.
 *
 * Drop-in: install `@sentry/react`, set VITE_SENTRY_DSN, and replace the
 * `report()` body with `Sentry.captureException`. No call sites change.
 */
const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const isProd = import.meta.env.PROD;

type Level = 'error' | 'warning' | 'info';

interface SentryLike {
  captureException?: (e: unknown, ctx?: unknown) => void;
  captureMessage?: (m: string, level?: Level) => void;
}

const getSentry = (): SentryLike | undefined =>
  (globalThis as { Sentry?: SentryLike }).Sentry;

export const logger = {
  /** Whether a real error backend is configured. */
  enabled: Boolean(DSN),

  captureException(error: unknown, context?: Record<string, unknown>) {
    const sentry = getSentry();
    if (DSN && sentry?.captureException) {
      sentry.captureException(error, context ? { extra: context } : undefined);
    } else if (!isProd) {
      console.error('[logger]', error, context ?? '');
    }
  },

  captureMessage(message: string, level: Level = 'info') {
    const sentry = getSentry();
    if (DSN && sentry?.captureMessage) {
      sentry.captureMessage(message, level);
    } else if (!isProd) {
      console.log(`[logger:${level}]`, message);
    }
  },
};

/** Attach global handlers once at startup. */
export const initErrorLogging = () => {
  window.addEventListener('error', (e) => logger.captureException(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => logger.captureException(e.reason));
};
