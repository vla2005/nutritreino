export function applyOnlineStatus(conversations, onlineUsers) {
  return conversations.map((conversation) => applyOnlineStatusToConversation(conversation, onlineUsers))
}

export function applyOnlineStatusToConversation(conversation, onlineUsers) {
  if (!conversation?.participant) return conversation
  return { ...conversation, participant: { ...conversation.participant, is_online: onlineUsers.has(conversation.participant.uuid) } }
}

export function appendMessage(conversation, message) {
  if (!conversation || conversation.messages?.some((item) => item.uuid === message.uuid)) return conversation
  return { ...conversation, messages: [...(conversation.messages || []), message], latest_message: message, last_message_at: message.created_at }
}

export function markMessagesRead(conversation, messageUuids = [], readAt = '') {
  if (!conversation || !messageUuids?.length) return conversation
  return { ...conversation, messages: (conversation.messages || []).map((message) => markMessageRead(message, messageUuids, readAt)), latest_message: markMessageRead(conversation.latest_message, messageUuids, readAt) }
}

export function markMessageRead(message, messageUuids = [], readAt = '') {
  return !message || !messageUuids.includes(message.uuid) ? message : { ...message, read_at: readAt || message.read_at }
}

export function upsertConversation(conversations, conversation) {
  return conversations.some((item) => item.uuid === conversation.uuid)
    ? conversations.map((item) => item.uuid === conversation.uuid ? { ...item, ...conversation } : item)
    : [conversation, ...conversations]
}

export function moveConversationToTop(conversations, uuid, message, incrementUnread = false) {
  return conversations.map((item) => item.uuid === uuid ? { ...item, latest_message: message, last_message_at: message.created_at, unread_count: incrementUnread ? Number(item.unread_count || 0) + 1 : Number(item.unread_count || 0) } : item)
    .sort((a, b) => new Date(b.last_message_at || b.updated_at || 0) - new Date(a.last_message_at || a.updated_at || 0))
}

export function emitUnreadCount(conversations = []) {
  const total = conversations.reduce((sum, conversation) => sum + Number(conversation.unread_count || 0), 0)
  window.dispatchEvent(new CustomEvent('chat:unread-updated', { detail: { total } }))
}

export function conversationPreview(message) {
  if (!message) return 'Sem mensagens ainda'
  if (message.type === 'video_call') return 'Chamada de video'
  return message.body || attachmentLabel(message) || 'Mensagem'
}

export function participantLabel(participant) {
  if (participant?.speciality === 'nutritionist') return 'Nutricionista'
  if (participant?.speciality === 'trainer') return 'Treinador'
  return participant?.role === 'client' ? 'Aluno' : 'Contato'
}

export function formatConversationTime(value) {
  const date = new Date(value)
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''
}

export function messagesWithDateSeparators(messages = []) {
  const items = []
  let lastKey = ''
  messages.forEach((message) => {
    const key = dateKey(message.created_at)
    if (key && key !== lastKey) {
      items.push({ kind: 'date', key: `date-${key}`, label: dateSeparatorLabel(message.created_at) })
      lastKey = key
    }
    items.push({ kind: 'message', message })
  })
  return items
}

function attachmentLabel(message) {
  if (!message?.attachment) return ''
  if (message.type === 'image') return 'Foto enviada'
  return `${fileType(message.attachment.mime)} - ${formatBytes(message.attachment.size)}`
}

function fileType(mime = '') {
  if (!mime) return 'Arquivo'
  if (mime === 'application/pdf') return 'PDF'
  if (mime.startsWith('image/')) return mime.replace('image/', '').toUpperCase()
  if (mime.includes('wordprocessingml') || mime === 'application/msword') return 'DOC'
  if (mime === 'text/plain') return 'TXT'
  return mime.split('/').pop()?.toUpperCase() || 'Arquivo'
}

function formatBytes(bytes = 0) {
  const value = Number(bytes || 0)
  if (!value) return '0 KB'
  return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

function dateKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateSeparatorLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000)
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  return date.toLocaleDateString('pt-BR')
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
