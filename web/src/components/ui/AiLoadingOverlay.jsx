import AiLoadingIcon from './AiLoadingIcon.jsx'

export default function AiLoadingOverlay({ text = 'IA trabalhando no rascunho' }) {
  return (
    <div className="ai-working-overlay" role="status" aria-live="polite" aria-label={text}>
      <div className="ai-working-loader">
        <AiLoadingIcon />
        <span>{text}</span>
      </div>
    </div>
  )
}
