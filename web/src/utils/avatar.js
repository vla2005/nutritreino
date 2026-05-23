import { API_ORIGIN } from '../config/api.js'

export function normalizeAvatarUrl(value) {
  if (!value || typeof value !== 'string') return ''

  const url = value.trim().replaceAll('\\/', '/')
  if (!url) return ''
  if (url.startsWith('/storage/')) return `${API_ORIGIN}${url}`

  return url
}
