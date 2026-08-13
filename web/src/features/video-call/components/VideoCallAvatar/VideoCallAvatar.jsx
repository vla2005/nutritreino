import { normalizeAvatarUrl } from '@/utils/avatar.js'

export default function VideoCallAvatar({ participant }) {
  const avatarUrl = normalizeAvatarUrl(participant?.avatar)
  const name = participant?.name || ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initials = parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'CT'

  return (
    <span className="video-call-avatar" aria-hidden="true">
      {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
    </span>
  )
}
