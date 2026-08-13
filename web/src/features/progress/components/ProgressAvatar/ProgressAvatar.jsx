import { normalizeAvatarUrl } from '@/utils/avatar.js'

export default function ProgressAvatar({ person }) {
  const avatarUrl = normalizeAvatarUrl(person?.avatar)

  return avatarUrl
    ? <img className="progress-access-avatar" src={avatarUrl} alt="" />
    : <span className="progress-access-avatar">{initials(person?.name || 'PR')}</span>
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'PR'
}
