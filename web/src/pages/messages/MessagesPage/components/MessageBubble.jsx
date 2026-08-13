import { useEffect, useState } from 'react'
import { useToast } from '@/composables/useToast.jsx'
import { getAttachmentBlob } from '@/services/messages.js'

export default function MessageBubble({ message, mine }) {
  if (message.type === 'video_call') return <VideoCallBubble message={message} mine={mine} />

  return (
    <article className={`messages-bubble ${mine ? 'is-mine' : ''}`}>
      {message.body ? <p>{message.body}</p> : null}
      {message.attachment ? <Attachment message={message} /> : null}
      <MessageMeta message={message} mine={mine} />
    </article>
  )
}

export function DateSeparator({ label }) {
  return <div className="messages-date-separator"><span>{label}</span></div>
}

function VideoCallBubble({ message, mine }) {
  return (
    <article className={`messages-bubble messages-call-history ${mine ? 'is-mine' : ''}`}>
      <span className="messages-call-history-icon" aria-hidden="true"><VideoIcon /></span>
      <span className="messages-call-history-content">
        <strong>{callHistoryTitle(message, mine)}</strong>
        <small>{callHistorySubtitle(message, mine)}</small>
      </span>
      <MessageMeta message={message} mine={mine} />
    </article>
  )
}

function MessageMeta({ message, mine }) {
  return (
    <span className="messages-bubble-meta">
      <time>{formatMessageTime(message.created_at)}</time>
      {mine ? <ReadReceipt read={Boolean(message.read_at)} /> : null}
    </span>
  )
}

function Attachment({ message }) {
  const toast = useToast()
  const [url, setUrl] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    let mounted = true
    let objectUrl = ''
    if (!message.attachment?.mime?.startsWith('image/')) return undefined

    getAttachmentBlob(message.uuid).then((blob) => {
      objectUrl = URL.createObjectURL(blob)
      if (mounted) setUrl(objectUrl)
    }).catch((error) => { if (mounted) toast.warning(error.message) })

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
    } catch (error) {
      toast.warning(error.message)
    }
  }

  if (!url) {
    return (
      <button type="button" className="messages-file-attachment" onClick={download}>
        <span className="messages-file-icon"><FileIcon /></span>
        <span><strong>{message.attachment.name || 'Arquivo'}</strong><small>{fileMeta(message.attachment)}</small></span>
      </button>
    )
  }

  return (
    <>
      <button type="button" className="messages-image-attachment" onClick={() => setDialogOpen(true)}>
        <img src={url} alt={message.attachment.name || 'Imagem enviada'} />
      </button>
      {dialogOpen ? <ImageDialog message={message} url={url} zoom={zoom} onZoom={setZoom} onDownload={download} onClose={() => setDialogOpen(false)} /> : null}
    </>
  )
}

function ImageDialog({ message, url, zoom, onZoom, onDownload, onClose }) {
  return (
    <div className="image-dialog-overlay" role="dialog" aria-modal="true" aria-label="Imagem enviada">
      <div className="image-dialog-toolbar">
        <button type="button" onClick={() => onZoom((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))))} aria-label="Diminuir zoom"><ZoomOutIcon /></button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => onZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))} aria-label="Aumentar zoom"><ZoomInIcon /></button>
        <button type="button" onClick={onDownload} aria-label="Baixar imagem"><DownloadIcon /></button>
        <button type="button" onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
      </div>
      <button type="button" className="image-dialog-backdrop" aria-label="Fechar imagem" onClick={onClose} />
      <div className="image-dialog-stage"><img src={url} alt={message.attachment.name || 'Imagem enviada'} style={{ transform: `scale(${zoom})` }} /></div>
    </div>
  )
}

function ReadReceipt({ read }) {
  return <span className={`messages-read-receipt ${read ? 'is-read' : ''}`} aria-label={read ? 'Mensagem lida' : 'Mensagem enviada'}><CheckIcon /><CheckIcon /></span>
}

function callHistoryTitle(message, mine) {
  if (message.body === 'ended') return 'Chamada de video'
  if (['no-answer', 'busy', 'rejected'].includes(message.body)) return mine ? 'Chamada nao atendida' : 'Chamada perdida'
  if (message.body === 'media-denied') return mine ? 'Chamada nao completada' : 'Chamada perdida'
  return 'Chamada de video'
}

function callHistorySubtitle(message, mine) {
  const labels = {
    ended: mine ? 'Voce encerrou a chamada' : 'Chamada encerrada',
    'no-answer': mine ? 'Ninguem atendeu em 45 segundos' : 'Voce nao atendeu a chamada',
    busy: mine ? 'O contato estava em outra chamada' : 'Voce estava em outra chamada',
    'media-denied': mine ? 'Nao foi possivel iniciar camera ou microfone' : 'O contato nao conseguiu entrar',
    rejected: mine ? 'O contato recusou a chamada' : 'Voce recusou a chamada',
  }
  return labels[message.body] || (mine ? 'Chamada enviada' : 'Chamada recebida')
}

function fileMeta(attachment) {
  const mime = attachment?.mime || ''
  const type = mime === 'application/pdf' ? 'PDF' : mime.startsWith('image/') ? mime.replace('image/', '').toUpperCase() : 'Arquivo'
  const bytes = Number(attachment?.size || 0)
  const size = bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
  return `${type} - ${size}`
}

function formatMessageTime(value) {
  const date = new Date(value)
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
}

function VideoIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 10 20 7v10l-5-3v-4ZM4 6h11v12H4V6Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function FileIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h7l4 4v14H7V3ZM14 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function ZoomOutIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 11h6M20 20l-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function ZoomInIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 11h6M11 8v6M20 20l-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
function DownloadIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> }
function CloseIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> }
