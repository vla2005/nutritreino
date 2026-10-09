// Absolute URLs belong to the server that supplied them, not necessarily API_ORIGIN.
export function resolveAvatarUrl(value, apiOrigin) {
  if (typeof value !== 'string') return ''
  const url = value.trim().replaceAll('\\/', '/')
  if (!url) return ''
  if (/^(https?:\/\/|blob:|data:image\/)/i.test(url)) return url
  if (url.startsWith('//')) return url
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) return ''
  const origin = apiOrigin.replace(/\/$/, '')
  if (url.startsWith('/')) return `${origin}${url}`
  if (url.startsWith('storage/')) return `${origin}/${url}`
  if (url.startsWith('avatars/')) return `${origin}/storage/${url}`
  return url
}
