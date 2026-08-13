export default function TypingIndicator({ variant = 'label' }) {
  const dots = <span aria-hidden="true"><i /><i /><i /></span>

  if (variant === 'bubble') {
    return <div className="messages-typing-bubble" aria-label="Contato digitando">{dots}</div>
  }

  return <span className="messages-typing-label">digitando{dots}</span>
}
