import { API_URL } from '../config/api.js'

const TOKEN_KEY = 'auth_token'

function token() {
  return localStorage.getItem(TOKEN_KEY)
}

function authHeaders(json = true) {
  return {
    Accept: 'application/json',
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token()}`,
  }
}

export async function listConversations() {
  const response = await fetch(`${API_URL}/conversations`, {
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(resolveMessage(json, 'Não foi possível carregar as conversas.'))
  return json.data || []
}

export async function getConversation(uuid) {
  const response = await fetch(`${API_URL}/conversations/${uuid}`, {
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(resolveMessage(json, 'Não foi possível abrir a conversa.'))
  return json.data
}

export async function startConversationWithProfessional(professionalUuid) {
  const response = await fetch(`${API_URL}/conversations/professionals/${professionalUuid}`, {
    method: 'POST',
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(resolveMessage(json, 'Não foi possível iniciar a conversa.'))
  return json.data
}

export async function startConversationWithClient(clientUuid) {
  const response = await fetch(`${API_URL}/conversations/clients/${clientUuid}`, {
    method: 'POST',
    headers: authHeaders(),
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(resolveMessage(json, 'Não foi possível iniciar a conversa.'))
  return json.data
}

export async function sendMessage(conversationUuid, { body, attachment }) {
  const form = new FormData()
  if (body?.trim()) form.append('body', body.trim())
  if (attachment) form.append('attachment', attachment)

  const response = await fetch(`${API_URL}/conversations/${conversationUuid}/messages`, {
    method: 'POST',
    headers: authHeaders(false),
    body: form,
  })

  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(resolveMessage(json, 'Não foi possível enviar a mensagem.'))
  return json.data
}

export async function getAttachmentBlob(messageUuid) {
  const response = await fetch(`${API_URL}/messages/${messageUuid}/attachment`, {
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  })

  if (!response.ok) throw new Error('Não foi possível baixar o anexo.')
  return response.blob()
}

export function attachmentDownloadUrl(messageUuid) {
  return `${API_URL}/messages/${messageUuid}/attachment`
}

function resolveMessage(json, fallback) {
  if (json?.message) return json.message
  if (json?.errors && typeof json.errors === 'object') {
    const first = Object.values(json.errors)[0]
    if (Array.isArray(first)) return first[0]
  }
  return fallback
}
