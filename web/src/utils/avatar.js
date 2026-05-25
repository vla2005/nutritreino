import { API_ORIGIN } from '../config/api.js'

export function normalizeAvatarUrl(value) {
  if (!value || typeof value !== 'string') return ''

  const url = value.trim().replaceAll('\\/', '/')
  if (!url) return ''
  if (url.startsWith('/storage/')) return `${API_ORIGIN}${url}`

  const storagePath = url.match(/^https?:\/\/[^/]+(\/storage\/.+)$/i)?.[1]
  if (storagePath) return `${API_ORIGIN}${storagePath}`

  return url
}
