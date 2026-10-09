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

export function versionAvatarUrl(src, apiOrigin) {
  if (!src || /^(blob:|data:)/i.test(src)) return src
  try {
    const origin = new URL(apiOrigin)
    const url = new URL(src, origin)
    // Only version our own public avatars. Never modify signed/external URLs.
    if (url.host !== origin.host || !url.pathname.startsWith('/storage/avatars/')) return src
    if (url.searchParams.has('signature') || url.searchParams.has('X-Amz-Signature')) return src
    url.protocol = origin.protocol
    url.searchParams.set('nt_avatar_v', '2')
    return url.href
  } catch {
    return src
  }
}

export function retryAvatarUrl(src, nonce) {
  try {
    const url = new URL(src)
    // Versioned URLs are our own public avatars, not external images or previews.
    if (!url.searchParams.has('nt_avatar_v')) return ''
    url.searchParams.set('nt_avatar_retry', String(nonce))
    return url.href
  } catch {
    return ''
  }
}
