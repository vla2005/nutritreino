import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { API_URL } from '../config/api.js'
import { PUSHER_APP_CLUSTER, PUSHER_APP_KEY } from '../config/pusher.js'

const TOKEN_KEY = 'auth_token'

let echo = null
let onlineChannel = null
const onlineUserUuids = new Set()

export function getEcho() {
  if (echo) return echo

  window.Pusher = Pusher

  echo = new Echo({
    broadcaster: 'pusher',
    key: PUSHER_APP_KEY,
    cluster: PUSHER_APP_CLUSTER,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        Accept: 'application/json',
      },
    },
  })

  return echo
}

export function leaveConversationChannel(conversationUuid) {
  if (!echo || !conversationUuid) return
  echo.leave(`conversations.${conversationUuid}`)
}

export function joinOnlineUsers() {
  if (onlineChannel) return onlineChannel

  onlineChannel = getEcho()
    .join('users.online')
    .here((users = []) => {
      onlineUserUuids.clear()
      users.forEach((user) => addOnlineUser(user))
      emitOnlineUsers()
    })
    .joining((user) => {
      addOnlineUser(user)
      emitOnlineUsers()
    })
    .leaving((user) => {
      removeOnlineUser(user)
      emitOnlineUsers()
    })

  return onlineChannel
}

export function leaveOnlineUsers() {
  if (!echo) return
  echo.leave('users.online')
  onlineChannel = null
  onlineUserUuids.clear()
  emitOnlineUsers()
}

export function getOnlineUserUuids() {
  return new Set(onlineUserUuids)
}

function addOnlineUser(user) {
  const uuid = normalizePresenceUuid(user)
  if (uuid) onlineUserUuids.add(uuid)
}

function removeOnlineUser(user) {
  const uuid = normalizePresenceUuid(user)
  if (uuid) onlineUserUuids.delete(uuid)
}

function normalizePresenceUuid(user) {
  return user?.uuid || user?.id || ''
}

function emitOnlineUsers() {
  window.dispatchEvent(new CustomEvent('presence:online-users', {
    detail: { uuids: [...onlineUserUuids] },
  }))
}
