import { API_URL } from '../config/api.js'

function authHeaders() {
  const token = localStorage.getItem('auth_token')
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload?.message || payload?.errors || 'Não foi possível carregar o progresso.'
    throw new Error(typeof message === 'string' ? message : 'Campos invalidos.')
  }
  return payload.data
}

export async function getProgress({ clientUuid } = {}) {
  const params = new URLSearchParams()
  if (clientUuid) params.set('client_uuid', clientUuid)

  const response = await fetch(`${API_URL}/progress${params.toString() ? `?${params}` : ''}`, {
    headers: authHeaders(),
  })

  return parseResponse(response)
}

export async function createProgressRecord(data) {
  const form = new FormData()
  if (data.client_uuid) form.append('client_uuid', data.client_uuid)
  form.append('record_date', data.record_date)
  form.append('weight', data.weight)
  if (data.target_weight) form.append('target_weight', data.target_weight)
  if (data.notes) form.append('notes', data.notes)
  form.append('measurements', JSON.stringify(data.measurements || {}))

  Object.entries(data.check_in || {}).forEach(([key, value]) => {
    if (value) form.append(`${key}_score`, value)
  })

  Object.entries(data.photos || {}).forEach(([type, file]) => {
    if (file) form.append(`photos[${type}]`, file)
  })

  const response = await fetch(`${API_URL}/progress`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })

  return parseResponse(response)
}

export async function saveProgressFeedback(recordUuid, feedback) {
  const response = await fetch(`${API_URL}/progress/records/${recordUuid}/feedback`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ feedback }),
  })

  return parseResponse(response)
}

export async function getProgressAccess() {
  const response = await fetch(`${API_URL}/progress/access`, {
    headers: authHeaders(),
  })

  return parseResponse(response)
}

export async function grantProgressAccess(professionalUuid) {
  const response = await fetch(`${API_URL}/progress/access`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ professional_uuid: professionalUuid }),
  })

  return parseResponse(response)
}

export async function revokeProgressAccess(professionalUuid) {
  const response = await fetch(`${API_URL}/progress/access/${professionalUuid}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload?.message || 'Não foi possível remover o acesso.')
  }

  return response.json().catch(() => ({}))
}
