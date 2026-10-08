import { useId } from 'react'
import { EnvelopeSimpleIcon } from '@phosphor-icons/react'

export default function Input({
  value = '',
  label,
  type = 'text',
  placeholder = '',
  disabled = false,
  icon,
  error = '',
  onChange,
}) {
  const id = useId()
  return (
    <div>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className="input-wrap">
        {icon === 'mail' && (
          <EnvelopeSimpleIcon
            className="input-leading-icon"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? id + '-error' : undefined}
          className={`input-field rounded-lg px-4 py-3 text-sm ${icon ? 'has-leading-icon' : ''} ${error ? 'is-invalid' : ''}`}
          onChange={(event) => onChange?.(event.target.value)}
        />
      </div>
      {error ? (
        <p id={id + '-error'} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
