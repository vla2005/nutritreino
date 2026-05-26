import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../composables/useAuth.js'
import { useToast } from '../../composables/useToast.jsx'
import { getEcho, getOnlineUserUuids, leaveConversationChannel } from '../../services/echo.js'
import { getAttachmentBlob, getConversation, listConversations, sendMessage } from '../../services/messages.js'
import { normalizeAvatarUrl } from '../../utils/avatar.js'
import chatWallpaper from '../../assets/wpp.webp'

export default function Messages() {
  const toast = useToast()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedUuid = searchParams.get('conversation')
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [body, setBody] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [sending, setSending] = useState(false)
  const [participantTyping, setParticipantTyping] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(() => getOnlineUserUuids())
  const fileInputRef = useRef(null)
  const listEndRef = useRef(null)
  const typingTimerRef = useRef(null)
  const participantTypingTimerRef = useRef(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const data = await listConversations()
        if (mounted) {
          const conversationsWithPresence = applyOnlineStatus(data, onlineUsers)
          setConversations(conversationsWithPresence)
          emitUnreadCount(conversationsWithPresence)
        }
      } catch (err) {
        if (mounted) toast.warning(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [toast])

  useEffect(() => {
    if (!selectedUuid) {
      setSelected(null)
      return
    }

    let mounted = true

    async function loadConversation() {
      try {
        setLoadingConversation(true)
        const data = await getConversation(selectedUuid)
        if (mounted) {
          setSelected(applyOnlineStatusToConversation(data, onlineUsers))
          setConversations((current) => {
            const next = upsertConversation(current, { ...applyOnlineStatusToConversation(data, onlineUsers), unread_count: 0 })
            emitUnreadCount(next)
            return next
          })
        }
      } catch (err) {
        if (mounted) toast.warning(err.message)
      } finally {
        if (mounted) setLoadingConversation(false)
      }
    }

    loadConversation()

    return () => {
      mounted = false
    }
  }, [selectedUuid, toast])

  useEffect(() => {
    if (!selectedUuid) return undefined

    const echo = getEcho()
    const channel = echo.private(`conversations.${selectedUuid}`)

    channel.listen('.message.sent', (event) => {
      const message = event.message
      setSelected((current) => current?.uuid === selectedUuid ? appendMessage(current, message) : current)
      setConversations((current) => {
        const next = moveConversationToTop(current, selectedUuid, message, message.sender_uuid !== user?.uuid)
        emitUnreadCount(next)
        return next
      })
    })

    channel.listenForWhisper('typing', (event) => {
      if (event.user_uuid === user?.uuid) return

      setParticipantTyping(Boolean(event.typing))

      window.clearTimeout(participantTypingTimerRef.current)
      if (event.typing) {
        participantTypingTimerRef.current = window.setTimeout(() => {
          setParticipantTyping(false)
        }, 1800)
      }
    })

    return () => {
      window.clearTimeout(participantTypingTimerRef.current)
      setParticipantTyping(false)
      leaveConversationChannel(selectedUuid)
    }
  }, [selectedUuid, user?.uuid])

  useEffect(() => {
    function handleOnlineUsers(event) {
      const nextOnlineUsers = new Set(event.detail?.uuids || [])
      setOnlineUsers(nextOnlineUsers)
      setConversations((current) => applyOnlineStatus(current, nextOnlineUsers))
      setSelected((current) => current ? applyOnlineStatusToConversation(current, nextOnlineUsers) : current)
    }

    window.addEventListener('presence:online-users', handleOnlineUsers)

    return () => {
      window.removeEventListener('presence:online-users', handleOnlineUsers)
    }
  }, [])

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [selected?.messages?.length])

  const filteredConversations = useMemo(() => conversations, [conversations])
  const canSend = Boolean(selected?.uuid) && (body.trim() || attachment) && !sending

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSend) return

    try {
      setSending(true)
      const message = await sendMessage(selected.uuid, { body, attachment })
      whisperTyping(false)
      setSelected((current) => appendMessage(current, message))
      setConversations((current) => {
        const next = moveConversationToTop(current, selected.uuid, message)
        emitUnreadCount(next)
        return next
      })
      setBody('')
      setAttachment(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      toast.warning(err.message)
    } finally {
      setSending(false)
    }
  }

  function selectConversation(uuid) {
    setSearchParams({ conversation: uuid })
  }

  function startVideoCall() {
    if (!selected?.uuid || !selected?.participant) return
    window.dispatchEvent(new CustomEvent('video-call:start', {
      detail: { conversation: selected },
    }))
  }

  function handleBodyChange(event) {
    const value = event.target.value
    setBody(value)

    if (!selectedUuid) return

    whisperTyping(Boolean(value.trim()))
    window.clearTimeout(typingTimerRef.current)

    if (value.trim()) {
      typingTimerRef.current = window.setTimeout(() => {
        whisperTyping(false)
      }, 1200)
    }
  }

  function whisperTyping(typing) {
    if (!selectedUuid || !user?.uuid) return

    try {
      getEcho().private(`conversations.${selectedUuid}`).whisper('typing', {
        user_uuid: user.uuid,
        typing,
      })
    } catch {
      // O indicador de digitação e auxiliar; falhas aqui não devem bloquear o chat.
    }
  }

  return (
    <section className={`messages-page ${selectedUuid ? 'has-selected' : ''}`} aria-label="Mensagens">
      <aside className="messages-sidebar">
        <div className="messages-sidebar-head dashboard-header">
          <div>
            <h1><span className="messages-mobile-title-icon" aria-hidden="true"><MessageIcon /></span>Mensagens</h1>
            <p>Conversas com pacientes e profissionais</p>
          </div>
        </div>

        <div className="messages-list-card">
          <div className="messages-search-row">
            <label className="messages-search">
              <SearchIcon />
              <input type="search" placeholder="Buscar conversa..." aria-label="Buscar conversa" />
            </label>
          </div>

          <div className="messages-conversation-list">
            {loading ? (
              <div className="messages-empty-list"><p>Carregando conversas...</p></div>
            ) : filteredConversations.length ? (
              filteredConversations.map((conversation) => (
                <button
                  type="button"
                  key={conversation.uuid}
                  className={`messages-conversation-item ${conversation.uuid === selectedUuid ? 'is-active' : ''}`}
                  onClick={() => selectConversation(conversation.uuid)}
                  >
                  <span className="messages-avatar-wrap">
                    <Avatar name={conversation.participant?.name} avatar={conversation.participant?.avatar} />
                    <PresenceDot online={conversation.participant?.is_online} />
                  </span>
                  <span>
                    <strong>{conversation.participant?.name || 'Contato'}</strong>
                    <small>{conversation.latest_message?.body || attachmentLabel(conversation.latest_message) || 'Sem mensagens ainda'}</small>
                  </span>
                  <span className="messages-conversation-meta">
                    <time>{formatConversationTime(conversation.last_message_at || conversation.updated_at)}</time>
                    {conversation.unread_count > 0 ? <b>{conversation.unread_count}</b> : null}
                  </span>
                </button>
              ))
            ) : (
              <div className="messages-empty-list">
                <span aria-hidden="true"><MessageIcon /></span>
                <h2>Nenhuma conversa</h2>
                <p>As conversas com pacientes e profissionais aparecerao aqui.</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="messages-chat" style={{ '--messages-wallpaper': `url(${chatWallpaper})` }}>
        <header className="messages-chat-head">
          <button type="button" className="messages-chat-back" onClick={() => setSearchParams({})} aria-label="Voltar para conversas">
            <ArrowLeftIcon />
          </button>
          {selected?.participant ? <Avatar name={selected.participant.name} avatar={selected.participant.avatar} /> : <div className="messages-contact-placeholder" aria-hidden="true" />}
          <div className="messages-chat-title">
            <div className="messages-chat-name">
              <strong>{selected?.participant?.name || 'Selecione uma conversa'}</strong>
              {selected?.participant ? <span className="messages-role-pill">{participantLabel(selected.participant)}</span> : null}
            </div>
            <span>
              {participantTyping ? <TypingLabel /> : selected ? <StatusLabel participant={selected.participant} /> : 'Mensagens privadas'}
            </span>
          </div>
          <div className="messages-chat-actions">
            <button type="button" className="messages-menu-button" aria-label="Buscar na conversa">
              <SearchIcon />
            </button>
            <button type="button" className="messages-menu-button messages-call-button" aria-label="Fazer chamada de video" disabled={!selected?.participant} onClick={startVideoCall}>
              <PhoneIcon />
            </button>
            <button type="button" className="messages-menu-button" aria-label="Mais opcoes">
              <DotsIcon />
            </button>
          </div>
        </header>

        <div className="messages-chat-body">
          {loadingConversation ? (
            <div className="messages-empty-chat"><p>Carregando mensagens...</p></div>
          ) : selected?.messages?.length ? (
            <div className="messages-thread">
              {messagesWithDateSeparators(selected.messages).map((item) => (
                item.kind === 'date'
                  ? <DateSeparator key={item.key} label={item.label} />
                  : <MessageBubble key={item.message.uuid} message={item.message} mine={item.message.sender_uuid === user?.uuid} />
              ))}
              <div ref={listEndRef} />
            </div>
          ) : (
            <div className="messages-empty-chat">
              <span aria-hidden="true"><MessageIcon /></span>
              <h2>{selected ? 'Comece a conversa' : 'Nenhuma conversa selecionada'}</h2>
              <p>{selected ? 'Envie uma mensagem, foto ou arquivo para este contato.' : 'Escolha um contato para iniciar ou continuar o atendimento.'}</p>
            </div>
          )}
        </div>

        <form className="messages-composer" onSubmit={handleSubmit}>
          <button type="button" aria-label="Anexar arquivo" disabled={!selected || sending} onClick={() => fileInputRef.current?.click()}>
            <AttachIcon />
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
          <div className="messages-composer-field">
            {attachment ? (
              <button type="button" className="messages-attachment-chip" onClick={() => setAttachment(null)}>
                {attachment.name}
              </button>
            ) : null}
            <input type="text" value={body} onChange={handleBodyChange} placeholder="Digite sua mensagem..." aria-label="Mensagem" disabled={!selected || sending} />
          </div>
          <button type="submit" aria-label="Enviar mensagem" disabled={!canSend}>
            <SendIcon />
          </button>
        </form>
      </div>
    </section>
  )
}

function MessageBubble({ message, mine }) {
  return (
    <article className={`messages-bubble ${mine ? 'is-mine' : ''}`}>
      {message.body ? <p>{message.body}</p> : null}
      {message.attachment ? <Attachment message={message} /> : null}
      <span className="messages-bubble-meta">
        <time>{formatMessageTime(message.created_at)}</time>
        {mine ? <ReadReceipt read={Boolean(message.read_at)} /> : null}
      </span>
    </article>
  )
}

function DateSeparator({ label }) {
  return <div className="messages-date-separator"><span>{label}</span></div>
}

function Attachment({ message }) {
  const toast = useToast()
  const [url, setUrl] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    let mounted = true
    let objectUrl = ''

    async function loadImage() {
      if (!message.attachment?.mime?.startsWith('image/')) return
      try {
        const blob = await getAttachmentBlob(message.uuid)
        objectUrl = URL.createObjectURL(blob)
        if (mounted) setUrl(objectUrl)
      } catch (err) {
        if (mounted) toast.warning(err.message)
      }
    }

    loadImage()

    return () => {
      mounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [message, toast])

  async function download() {
    try {
      const blob = await getAttachmentBlob(message.uuid)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = message.attachment.name || 'arquivo'
      link.click()
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      toast.warning(err.message)
    }
  }

  if (url) {
    return (
      <>
        <button type="button" className="messages-image-attachment" onClick={() => setDialogOpen(true)}>
          <img src={url} alt={message.attachment.name || 'Imagem enviada'} />
        </button>

        {dialogOpen ? (
          <div className="image-dialog-overlay" role="dialog" aria-modal="true" aria-label="Imagem enviada">
            <div className="image-dialog-toolbar">
              <button type="button" onClick={() => setZoom((current) => Math.max(0.5, Number((current - 0.25).toFixed(2))))} aria-label="Diminuir zoom">
                <ZoomOutIcon />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((current) => Math.min(3, Number((current + 0.25).toFixed(2))))} aria-label="Aumentar zoom">
                <ZoomInIcon />
              </button>
              <button type="button" onClick={download} aria-label="Baixar imagem">
                <DownloadIcon />
              </button>
              <button type="button" onClick={() => setDialogOpen(false)} aria-label="Fechar">
                <CloseIcon />
              </button>
            </div>
            <button type="button" className="image-dialog-backdrop" aria-label="Fechar imagem" onClick={() => setDialogOpen(false)} />
            <div className="image-dialog-stage">
              <img src={url} alt={message.attachment.name || 'Imagem enviada'} style={{ transform: `scale(${zoom})` }} />
            </div>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <button type="button" className="messages-file-attachment" onClick={download}>
      <span className="messages-file-icon"><FileIcon /></span>
      <span>
        <strong>{message.attachment.name || 'Arquivo'}</strong>
        <small>{fileMeta(message.attachment)}</small>
      </span>
    </button>
  )
}

function Avatar({ name = '', avatar = '' }) {
  const avatarUrl = normalizeAvatarUrl(avatar)

  return (
    <span className="messages-avatar" aria-hidden="true">
      {avatarUrl ? <img src={avatarUrl} alt="" /> : initials(name)}
    </span>
  )
}

function TypingLabel() {
  return (
    <span className="messages-typing-label">
      digitando
      <span aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </span>
  )
}

function StatusLabel({ participant }) {
  return (
    <span className={`messages-status-label ${participant?.is_online ? 'is-online' : ''}`}>
      <PresenceDot online={participant?.is_online} />
      {participant?.is_online ? 'Online' : 'Offline'}
    </span>
  )
}

function PresenceDot({ online }) {
  return <i className={`messages-presence-dot ${online ? 'is-online' : ''}`} aria-hidden="true" />
}

function ReadReceipt({ read }) {
  return (
    <span className={`messages-read-receipt ${read ? 'is-read' : ''}`} aria-label={read ? 'Mensagem lida' : 'Mensagem enviada'}>
      <CheckIcon />
      <CheckIcon />
    </span>
  )
}

function applyOnlineStatus(conversations, onlineUsers) {
  return conversations.map((conversation) => applyOnlineStatusToConversation(conversation, onlineUsers))
}

function applyOnlineStatusToConversation(conversation, onlineUsers) {
  if (!conversation?.participant) return conversation

  return {
    ...conversation,
    participant: {
      ...conversation.participant,
      is_online: onlineUsers.has(conversation.participant.uuid),
    },
  }
}

function appendMessage(conversation, message) {
  if (!conversation) return conversation
  if (conversation.messages?.some((item) => item.uuid === message.uuid)) return conversation
  return { ...conversation, messages: [...(conversation.messages || []), message], latest_message: message, last_message_at: message.created_at }
}

function upsertConversation(conversations, conversation) {
  const exists = conversations.some((item) => item.uuid === conversation.uuid)
  if (!exists) return [conversation, ...conversations]
  return conversations.map((item) => item.uuid === conversation.uuid ? { ...item, ...conversation } : item)
}

function moveConversationToTop(conversations, uuid, message, incrementUnread = false) {
  const updated = conversations.map((item) => item.uuid === uuid ? {
    ...item,
    latest_message: message,
    last_message_at: message.created_at,
    unread_count: incrementUnread ? Number(item.unread_count || 0) + 1 : Number(item.unread_count || 0),
  } : item)
  return updated.sort((a, b) => new Date(b.last_message_at || b.updated_at || 0) - new Date(a.last_message_at || a.updated_at || 0))
}

function emitUnreadCount(conversations = []) {
  const total = conversations.reduce((sum, conversation) => sum + Number(conversation.unread_count || 0), 0)
  window.dispatchEvent(new CustomEvent('chat:unread-updated', { detail: { total } }))
}

function attachmentLabel(message) {
  if (!message?.attachment) return ''
  if (message.type === 'image') return 'Foto enviada'
  return `${fileType(message.attachment.mime)} - ${formatBytes(message.attachment.size)}`
}

function fileMeta(attachment) {
  return `${fileType(attachment?.mime)} - ${formatBytes(attachment?.size)}`
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
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

function participantLabel(participant) {
  if (participant?.speciality === 'nutritionist') return 'Nutricionista'
  if (participant?.speciality === 'trainer') return 'Treinador'
  return participant?.role === 'client' ? 'Aluno' : 'Contato'
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() : 'CT'
}

function formatConversationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatMessageTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function messagesWithDateSeparators(messages = []) {
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

function dateKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateSeparatorLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const today = startOfDay(new Date())
  const target = startOfDay(date)
  const diffDays = Math.round((today - target) / 86400000)

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'

  return date.toLocaleDateString('pt-BR')
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m21 21-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8.1 4.5 9.8 8c.4.8.2 1.7-.4 2.3l-1 1a11.7 11.7 0 0 0 4.3 4.3l1-1c.6-.6 1.5-.8 2.3-.4l3.5 1.7c.8.4 1.2 1.2 1 2.1l-.5 2.1c-.2.8-.9 1.4-1.7 1.4C9.6 21.4 2.6 14.4 2.6 5.7c0-.8.6-1.5 1.4-1.7l2.1-.5c.9-.2 1.7.2 2 .9Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function MessageIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M5.5 5.5h13a2 2 0 0 1 2 2v7.2a2 2 0 0 1-2 2h-5.2L8.1 20v-3.3H5.5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 10h8M8 13h5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
}

function DotsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5.5h.01M12 12h.01M12 18.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
}

function AttachIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m20 11.4-8.6 8.6a5 5 0 0 1-7.1-7.1l9.2-9.2a3.4 3.4 0 0 1 4.8 4.8l-9.1 9.1a1.8 1.8 0 1 1-2.5-2.5l8.5-8.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function SendIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 4 10.6 14.4M21 4l-6.6 17-3.8-6.6L4 10.6 21 4Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function FileIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h7l5 5v13H7V3Z" fill="currentColor" opacity="0.92" /><path d="M14 3v5h5" stroke="rgba(255,255,255,.72)" strokeWidth="1.5" strokeLinejoin="round" /></svg>
}

function ZoomOutIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM21 21l-4.35-4.35M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function ZoomInIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM21 21l-4.35-4.35M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v10M8 10l4 4 4-4M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
