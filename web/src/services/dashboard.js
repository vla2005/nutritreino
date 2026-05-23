import { API_URL } from '../config/api.js'

function authHeaders() {
  const token = localStorage.getItem('auth_token')
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function getNutritionistDashboard() {
  const response = await fetch(`${API_URL}/dashboard/nutritionist`, {
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(json?.message || 'Não foi possível carregar o dashboard.')
  }

  return json.data
}

export async function getTrainerDashboard() {
  const response = await fetch(`${API_URL}/dashboard/trainer`, {
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(json?.message || 'Não foi possível carregar o dashboard.')
  }

  return json.data
}
