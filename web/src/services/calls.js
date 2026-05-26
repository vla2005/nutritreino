import { API_URL } from '../config/api.js'

const TOKEN_KEY = 'auth_token'

function token() {
  return localStorage.getItem(TOKEN_KEY)
}

export async function sendCallSignal(conversationUuid, { callId, type, payload = {} }) {
  const response = await fetch(`${API_URL}/conversations/${conversationUuid}/calls/signals`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify({
      call_id: callId,
      type,
      payload,
    }),
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(resolveMessage(json, 'Nao foi possivel sincronizar a chamada.'))
  return json.data
}

function resolveMessage(json, fallback) {
  if (json?.message) return json.message
  if (json?.errors && typeof json.errors === 'object') {
    const first = Object.values(json.errors)[0]
    if (Array.isArray(first)) return first[0]
  }
  return fallback
}
