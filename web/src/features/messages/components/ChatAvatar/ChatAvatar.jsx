import { normalizeAvatarUrl } from '@/utils/avatar.js'

export default function ChatAvatar({ name = '', avatar = '' }) {
  const avatarUrl = normalizeAvatarUrl(avatar)

  return (
    <span className="messages-avatar" aria-hidden="true">
      {avatarUrl ? <img src={avatarUrl} alt="" /> : initials(name)}
    </span>
  )
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'CT'
}
