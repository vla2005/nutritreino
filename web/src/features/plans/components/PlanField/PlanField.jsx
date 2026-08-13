export default function PlanField({ label, className = '', children }) {
  return (
    <label className={`plan-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}
