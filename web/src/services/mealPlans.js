import { API_URL } from '../config/api.js'

const TOKEN_KEY = 'auth_token'

function authHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
  }
}

export async function createMealPlan(data) {
  const response = await fetch(`${API_URL}/mealplans`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw responseError(json, 'Não foi possível criar o plano.')
  }

  return json.data
}

export async function listMealPlans(options = {}) {
  const params = new URLSearchParams()
  if (options.page) params.set('page', options.page)
  if (options.perPage) params.set('per_page', options.perPage)
  if (options.clientUuid) params.set('client_uuid', options.clientUuid)
  if (options.search) params.set('search', options.search)
  if (options.status) params.set('status', options.status)

  const response = await fetch(`${API_URL}/mealplans${params.size ? `?${params}` : ''}`, {
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw responseError(json, 'Não foi possível carregar os planos.')
  }

  const data = Array.isArray(json.data) ? json.data : []
  return options.withMeta ? { data, meta: json.meta || emptyMeta(data.length) } : data
}

function emptyMeta(total = 0) {
  return { current_page: 1, last_page: 1, per_page: total, total, from: total ? 1 : null, to: total || null }
}

export async function getMealPlan(uuid) {
  const response = await fetch(`${API_URL}/mealplans/${uuid}`, {
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw responseError(json, 'Não foi possível carregar o plano.')
  }

  return json.data
}

export async function updateMealPlan(uuid, data) {
  const response = await fetch(`${API_URL}/mealplans/${uuid}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw responseError(json, 'Não foi possível atualizar o plano.')
  }

  return json.data
}

function responseError(json, fallback) {
  const error = new Error(resolveMessage(json, fallback))

  if (json?.errors && typeof json.errors === 'object' && !Array.isArray(json.errors)) {
    error.fieldErrors = Object.entries(json.errors).reduce((carry, [field, messages]) => {
      carry[field] = Array.isArray(messages) ? messages[0] : String(messages)
      return carry
    }, {})
  }

  return error
}

function resolveMessage(json, fallback) {
  if (typeof json?.errors === 'string') return json.errors
  if (json?.message) return json.message
  return fallback
}
