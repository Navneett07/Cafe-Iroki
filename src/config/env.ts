export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  mapsKey: import.meta.env.VITE_MAPS_KEY || '',
  isMock: !import.meta.env.VITE_API_URL,
};
