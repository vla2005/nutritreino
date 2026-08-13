export default function ProgressCheckIn({ values, items }) {
  return (
    <div className="progress-check-list">
      {items.map((item) => (
        <div className="progress-check-row" key={item.key}>
          <span aria-hidden="true">{item.icon}</span>
          <strong>{item.label}</strong>
          <RatingDots value={values?.[item.key] || 0} />
        </div>
      ))}
    </div>
  )
}

function RatingDots({ value }) {
  return <span className="progress-rating-dots">{[1, 2, 3, 4, 5].map((item) => <i key={item} className={item <= Number(value || 0) ? 'is-on' : ''} />)}</span>
}
