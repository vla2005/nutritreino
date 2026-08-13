import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import chatWallpaper from '@/assets/wpp.webp'
import { useAuth } from '@/composables/useAuth.js'
import { useToast } from '@/composables/useToast.jsx'
import ChatAvatar from '@/features/messages/components/ChatAvatar/ChatAvatar.jsx'
import PresenceStatus, { PresenceDot } from '@/features/messages/components/PresenceStatus/PresenceStatus.jsx'
import TypingIndicator from '@/features/messages/components/TypingIndicator/TypingIndicator.jsx'
import { getEcho, getOnlineUserUuids, leaveConversationChannel } from '@/services/echo.js'
import { getConversation, listConversations, markConversationRead, sendMessage } from '@/services/messages.js'
import MessageBubble, { DateSeparator } from './components/MessageBubble.jsx'
import {
  appendMessage,
  applyOnlineStatus,
  applyOnlineStatusToConversation,
  conversationPreview,
  emitUnreadCount,
  formatConversationTime,
  markMessageRead,
  markMessagesRead,
  messagesWithDateSeparators,
  moveConversationToTop,
  participantLabel,
  upsertConversation,
} from './utils/messageUtils.js'
import './MessagesPage.css'

export default function MessagesPage() {
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
          markConversationRead(selectedUuid).catch(() => {})
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
        const next = moveConversationToTop(current, selectedUuid, message, false)
        emitUnreadCount(next)
        return next
      })

      if (message.sender_uuid !== user?.uuid) {
        markConversationRead(selectedUuid).catch(() => {})
      }
    })

    channel.listen('.messages.read', (event) => {
      if (event.reader_uuid === user?.uuid) return

      setSelected((current) => current?.uuid === selectedUuid ? markMessagesRead(current, event.message_uuids, event.read_at) : current)
      setConversations((current) => current.map((conversation) => (
        conversation.uuid === selectedUuid
          ? { ...conversation, latest_message: markMessageRead(conversation.latest_message, event.message_uuids, event.read_at) }
          : conversation
      )))
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
    function handleCallHistoryMessage(event) {
      const message = event.detail?.message
      const conversationUuid = event.detail?.conversationUuid || message?.conversation_uuid
      if (!message || !conversationUuid) return

      setSelected((current) => current?.uuid === conversationUuid ? appendMessage(current, message) : current)
      setConversations((current) => {
        const next = moveConversationToTop(current, conversationUuid, message)
        emitUnreadCount(next)
        return next
      })
    }

    window.addEventListener('video-call:history-message', handleCallHistoryMessage)

    return () => {
      window.removeEventListener('video-call:history-message', handleCallHistoryMessage)
    }
  }, [])

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
  }, [selected?.messages?.length, participantTyping])

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
                    <ChatAvatar name={conversation.participant?.name} avatar={conversation.participant?.avatar} />
                    <PresenceDot online={conversation.participant?.is_online} />
                  </span>
                  <span>
                    <strong>{conversation.participant?.name || 'Contato'}</strong>
                    <small>{conversationPreview(conversation.latest_message)}</small>
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
          {selected?.participant ? <ChatAvatar name={selected.participant.name} avatar={selected.participant.avatar} /> : <div className="messages-contact-placeholder" aria-hidden="true" />}
          <div className="messages-chat-title">
            <div className="messages-chat-name">
              <strong>{selected?.participant?.name || 'Selecione uma conversa'}</strong>
              {selected?.participant ? <span className="messages-role-pill">{participantLabel(selected.participant)}</span> : null}
            </div>
            <span>
              {participantTyping ? <TypingIndicator variant="label" /> : selected ? <PresenceStatus participant={selected.participant} /> : 'Mensagens privadas'}
            </span>
          </div>
          <div className="messages-chat-actions">
            <button type="button" className="messages-menu-button" aria-label="Buscar na conversa">
              <SearchIcon />
            </button>
            <button type="button" className="messages-menu-button messages-call-button" aria-label="Fazer chamada de video" disabled={!selected?.participant} onClick={startVideoCall}>
              <VideoIcon />
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
              {participantTyping ? <TypingIndicator variant="bubble" /> : null}
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

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m21 21-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function VideoIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM16 10l6-3v10l-6-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
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

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
