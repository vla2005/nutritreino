import { API_ORIGIN } from '../config/api.js'
import { resolveAvatarUrl, versionAvatarUrl } from './avatarUrl.js'

export function normalizeAvatarUrl(value) {
  return versionAvatarUrl(resolveAvatarUrl(value, API_ORIGIN), API_ORIGIN)
}
