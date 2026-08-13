export const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || globalThis.location?.origin || 'http://localhost:8080').replace(/\/$/, '')
export const API_URL = `${API_ORIGIN}/api`
