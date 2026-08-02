export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL || 'https://event-link-soroban.onrender.com'
).replace(/\/$/, '');
