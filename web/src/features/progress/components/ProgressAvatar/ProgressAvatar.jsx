import { normalizeAvatarUrl } from '@/utils/avatar.js'
import AvatarImage from '@/shared/components/ui/AvatarImage/AvatarImage.jsx'

export default function ProgressAvatar({ person }) {
  const avatarUrl = normalizeAvatarUrl(person?.avatar)

  return <AvatarImage src={avatarUrl} className="progress-access-avatar" fallback={<span className="progress-access-avatar">{initials(person?.name || 'PR')}</span>} />
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'PR'
}
