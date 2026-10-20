import { formatCalendarDate } from '@/shared/utils/calendarDate.js'

export default function ProgressPhotos({ photos, items, onOpen }) {
  const byType = Object.fromEntries(photos.map((photo) => [photo.type, photo]))

  return (
    <div className="progress-photo-grid">
      {items.map((item) => (
        <button type="button" className="progress-photo-card" key={item.key} onClick={() => onOpen(item.key)}>
          {byType[item.key]?.url ? <img src={byType[item.key].url} alt="" /> : <div className="progress-photo-placeholder"><PhotoIcon /></div>}
          {byType[item.key]?.record_date ? <span>{formatCalendarDate(byType[item.key].record_date)}</span> : null}
          <strong>{item.label}</strong>
        </button>
      ))}
    </div>
  )
}

function PhotoIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4V8ZM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
