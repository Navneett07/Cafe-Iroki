export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  mapsKey: import.meta.env.VITE_MAPS_KEY || '',
  isMock: !import.meta.env.VITE_API_URL,
};

/**
 * Production environment validation. Warns (does not crash) when required
 * public env vars are missing so misconfigured deployments are visible.
 */
export const validateEnv = (): string[] => {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;
  const missing = required.filter((k) => !import.meta.env[k]);
  if (missing.length && import.meta.env.PROD) {
    console.error(`[env] Missing required environment variables: ${missing.join(', ')}`);
  }
  return missing;
};
