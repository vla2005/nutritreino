import { API_ORIGIN } from '../config/api.js'
import { resolveAvatarUrl } from './avatarUrl.js'

export function normalizeAvatarUrl(value) {
  return resolveAvatarUrl(value, API_ORIGIN)
}
