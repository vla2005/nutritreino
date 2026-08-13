export default function RegisterSteps({ current, total }) {
  return (
    <div className="register-progress" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1
        return <div key={step} className={`register-progress-bar ${step <= current ? 'is-active' : ''}`} />
      })}
    </div>
  )
}
