export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null

  const current = meta.current_page || 1
  const last = meta.last_page || 1

  return (
    <nav className="pagination-bar" aria-label="Paginacao">
      <span>
        {meta.from || 0}-{meta.to || 0} de {meta.total || 0}
      </span>
      <div>
        <button type="button" onClick={() => onPageChange(current - 1)} disabled={current <= 1}>
          Anterior
        </button>
        <strong>{current} / {last}</strong>
        <button type="button" onClick={() => onPageChange(current + 1)} disabled={current >= last}>
          Proxima
        </button>
      </div>
    </nav>
  )
}
