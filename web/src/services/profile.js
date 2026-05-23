import { API_URL } from '../config/api.js'

const TOKEN_KEY = 'auth_token'

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function updateMyProfile(data) {
  const form = new FormData()
  form.append('_method', 'PUT')
  form.append('name', data.name || '')
  form.append('email', data.email || '')
  if (data.phone) form.append('phone', data.phone)
  if (data.cpf) form.append('cpf', data.cpf)
  if (data.avatar_file) form.append('avatar_file', data.avatar_file)

  if (data.role === 'professional') {
    form.append('speciality', data.speciality || '')
    form.append('registration', data.registration || '')
    if (data.bio) form.append('bio', data.bio)
  }

  if (data.role === 'client') {
    if (data.gender) form.append('gender', data.gender)
    if (data.birth_date) form.append('birth_date', data.birth_date)
    if (data.height) form.append('height', data.height)
    if (data.weight) form.append('weight', data.weight)
  }

  const response = await fetch(`${API_URL}/me`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(resolveMessage(json))
    error.fieldErrors = json?.errors || null
    throw error
  }

  return json.data
}

function resolveMessage(json) {
  if (json?.message) return json.message
  if (json?.errors && typeof json.errors === 'object') {
    const first = Object.values(json.errors)[0]
    return Array.isArray(first) ? first[0] : String(first)
  }
  return 'Não foi possível atualizar o perfil.'
}
