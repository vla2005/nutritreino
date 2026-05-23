import { API_URL } from '../config/api.js'

const TOKEN_KEY = 'auth_token'

function authHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
  }
}

export async function getProfessional(uuid) {
  const response = await fetch(`${API_URL}/professionals/${uuid}`, {
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(resolveMessage(json, 'Não foi possível carregar o profissional.'))
  }

  return json.data
}

function resolveMessage(json, fallback) {
  if (typeof json?.errors === 'string') return json.errors
  if (json?.message) return json.message
  return fallback
}
