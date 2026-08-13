import './RouteFallback.css'

export default function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span aria-hidden="true" />
      <p>Carregando...</p>
    </div>
  )
}
