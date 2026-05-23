import { API_URL } from '../config/api.js'

const TOKEN_KEY = 'auth_token'

function authHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
  }
}

export async function listClients(options = {}) {
  const params = new URLSearchParams()
  if (options.page) params.set('page', options.page)
  if (options.perPage) params.set('per_page', options.perPage)
  if (!options.withMeta && !options.perPage) params.set('per_page', 100)
  if (options.search) params.set('search', options.search)

  const response = await fetch(`${API_URL}/clients${params.size ? `?${params}` : ''}`, {
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw responseError(json, 'Não foi possível carregar os pacientes.')
  }

  const data = Array.isArray(json.data) ? json.data : []
  return options.withMeta ? { data, meta: json.meta || emptyMeta(data.length) } : data
}

export async function getClient(uuid) {
  const response = await fetch(`${API_URL}/clients/${uuid}`, {
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw responseError(json, 'Não foi possível carregar o cliente.')
  }

  return json.data
}

function emptyMeta(total = 0) {
  return { current_page: 1, last_page: 1, per_page: total, total, from: total ? 1 : null, to: total || null }
}

export async function inviteClient(data) {
  const response = await fetch(`${API_URL}/clients/invite`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(cleanClientPayload(data)),
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw responseError(json, 'Não foi possível cadastrar o paciente.')
  }

  return json.data
}

export function cleanClientPayload(data) {
  const payload = {
    name: data.name?.trim() || '',
    email: data.email?.trim().toLowerCase() || '',
    phone: onlyDigits(data.phone),
    cpf: onlyDigits(data.cpf),
    gender: data.gender || '',
    birth_date: data.birth_date || '',
    height: data.height?.trim() || '',
    weight: data.weight?.trim() || '',
  }

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== ''))
}

export function validateClientPayload(data) {
  const errors = {}
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const cpf = onlyDigits(data.cpf)

  if (!data.name?.trim()) errors.name = 'O nome e obrigatorio.'
  else if (data.name.length > 255) errors.name = 'O nome não pode ultrapassar 255 caracteres.'

  if (!data.email?.trim()) errors.email = 'O e-mail e obrigatorio.'
  else if (!emailPattern.test(data.email)) errors.email = 'Informe um e-mail valido.'
  else if (data.email.length > 255) errors.email = 'O e-mail não pode ultrapassar 255 caracteres.'

  if (data.phone && data.phone.length > 255) errors.phone = 'O telefone não pode ultrapassar 255 caracteres.'
  if (cpf && cpf.length !== 11) errors.cpf = 'O CPF deve ter exatamente 11 caracteres.'
  if (data.gender && !['male', 'female'].includes(data.gender)) errors.gender = 'Selecione um genero valido.'
  if (data.height && data.height.length > 3) errors.height = 'A altura não pode ultrapassar 3 caracteres.'
  if (data.weight && data.weight.length > 3) errors.weight = 'O peso não pode ultrapassar 3 caracteres.'

  return errors
}

export function clientErrorToFormErrors(error) {
  if (error?.fieldErrors) return error.fieldErrors

  const message = error?.message || ''
  if (message.includes('phone')) return { phone: 'Este telefone ja esta em uso.' }
  if (message.includes('cpf')) return { cpf: 'Este CPF ja esta em uso.' }
  if (message.includes('already active')) return { email: 'Este paciente ja esta ativo para este profissional.' }

  return {}
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

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '')
}
