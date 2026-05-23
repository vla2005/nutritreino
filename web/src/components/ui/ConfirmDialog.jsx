export default function ConfirmDialog({
  open,
  title = 'Confirmar acao',
  message = 'Tem certeza que deseja continuar?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  tone = 'danger',
  onConfirm,
  onClose,
}) {
  if (!open) return null

  return (
    <div className="confirm-dialog-overlay" role="presentation" onMouseDown={onClose}>
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div>
          <span className={`confirm-dialog-icon is-${tone}`} aria-hidden="true">
            <AlertIcon />
          </span>
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{message}</p>
        </div>

        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-cancel" disabled={loading} onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="button" className={`confirm-dialog-confirm is-${tone}`} disabled={loading} onClick={onConfirm}>
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function AlertIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v5M12 17h.01M10.3 4.8 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
