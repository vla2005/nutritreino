export default function Input({ value = '', label, type = 'text', placeholder = '', disabled = false, icon, error = '', onChange }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="input-wrap">
        {icon === 'mail' && <MailIcon />}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field rounded-lg px-4 py-3 text-sm ${icon ? 'has-leading-icon' : ''} ${error ? 'is-invalid' : ''}`}
          onChange={(event) => onChange?.(event.target.value)}
        />
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}

function MailIcon() {
  return (
    <svg className="input-leading-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.75 6.75h14.5v10.5H4.75z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m5.25 7.25 6.75 5 6.75-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
