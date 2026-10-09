import { useState } from 'react'
import { retryAvatarUrl } from '@/utils/avatarUrl.js'

export default function AvatarImage({ src, fallback = null, alt = '', ...props }) {
  const [failure, setFailure] = useState(null)
  const currentFailure = failure?.source === src ? failure : null
  if (!src || currentFailure?.exhausted) return fallback
  const imageSrc = currentFailure?.retry || src

  function handleError() {
    const retry = currentFailure ? '' : retryAvatarUrl(src, Date.now())
    setFailure({ source: src, retry, exhausted: !retry })
  }

  return <img {...props} key={imageSrc} src={imageSrc} alt={alt} onError={handleError} />
}
