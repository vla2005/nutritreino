import { API_URL } from '../config/api.js'

export async function getClientInvitation(token) {
  const response = await fetch(`${API_URL}/clients/invite?token=${encodeURIComponent(token)}`, {
    headers: { Accept: 'application/json' },
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(resolveMessage(json, 'Não foi possível carregar o convite.'))
  }

  return json.data
}

export async function acceptClientInvitation({ token, password, password_confirmation }) {
  const payload = { token }

  if (password || password_confirmation) {
    payload.password = password
    payload.password_confirmation = password_confirmation
  }

  const response = await fetch(`${API_URL}/clients/accept-invite`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(resolveMessage(json, 'Não foi possível criar sua senha.'))
    error.fieldErrors = extractFieldErrors(json)
    throw error
  }

  return json.data
}

export function validateAcceptInvitePassword(form) {
  const errors = {}

  if (!form.password) errors.password = 'A senha e obrigatoria.'
  else if (form.password.length < 6) errors.password = 'A senha deve ter no minimo 6 caracteres.'

  if (!form.password_confirmation) errors.password_confirmation = 'Confirme sua senha.'
  else if (form.password !== form.password_confirmation) errors.password_confirmation = 'As senhas não conferem.'

  return errors
}

function resolveMessage(json, fallback) {
  if (typeof json?.errors === 'string') return json.errors
  if (json?.message) return json.message
  return fallback
}

function extractFieldErrors(json) {
  if (!json?.errors || typeof json.errors !== 'object' || Array.isArray(json.errors)) return {}

  return Object.entries(json.errors).reduce((carry, [field, messages]) => {
    carry[field] = Array.isArray(messages) ? messages[0] : String(messages)
    return carry
  }, {})
}
