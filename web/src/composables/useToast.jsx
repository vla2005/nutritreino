import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const remove = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const push = useCallback((type, message, title = '', duration = 4000) => {
    const id = crypto.randomUUID()
    setItems((current) => [...current, { id, type, message, title, duration }])
    window.setTimeout(() => {
      remove(id)
    }, duration)
  }, [remove])

  const api = useMemo(
    () => ({
      setInstance: () => {},
      success: (message, title = '', duration = 4000) => push('success', message, title, duration),
      error: (message, title = '', duration = 4000) => push('error', message, title, duration),
      warning: (message, title = '', duration = 4000) => push('warning', message, title, duration),
      info: (message, title = '', duration = 4000) => push('info', message, title, duration),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport">
        {items.map((item) => (
          <ToastItem key={item.id} item={item} onClose={() => remove(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const toastMeta = {
  success: {
    title: 'Tudo certo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    title: 'Algo deu errado',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 8v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M10.3 4.3 2.9 17.1A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.9L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    ),
  },
  warning: {
    title: 'Atencao',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 7v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.9" />
      </svg>
    ),
  },
  info: {
    title: 'Informacao',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 11v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 7h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.9" />
      </svg>
    ),
  },
}

function ToastItem({ item, onClose }) {
  const meta = toastMeta[item.type] ?? toastMeta.info
  const role = item.type === 'error' || item.type === 'warning' ? 'alert' : 'status'

  return (
    <div className={`toast-card toast-card-${item.type}`} role={role}>
      <div className="toast-icon">{meta.icon}</div>
      <div className="toast-copy">
        <p className="toast-title">{item.title || meta.title}</p>
        <p className="toast-message">{item.message}</p>
      </div>
      <button className="toast-close" type="button" onClick={onClose} aria-label="Fechar aviso">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <span className="toast-progress" style={{ animationDuration: `${item.duration}ms` }} />
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }

  return context
}
