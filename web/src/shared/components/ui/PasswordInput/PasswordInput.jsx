import { useId, useState } from 'react'
import { EyeIcon, EyeSlashIcon, LockSimpleIcon } from '@phosphor-icons/react'

export default function PasswordInput({
  value = '',
  label = 'Senha',
  placeholder = '********',
  showForgot = true,
  error = '',
  onChange,
}) {
  const [show, setShow] = useState(false)
  const id = useId()
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="form-label !mb-0">
          {label}
        </label>
        {showForgot ? (
          <a href="#" className="forgot-link">
            Esqueci minha senha
          </a>
        ) : null}
      </div>
      <div className="relative">
        <LockSimpleIcon className="input-leading-icon" aria-hidden="true" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? id + '-error' : undefined}
          className={`input-field has-leading-icon rounded-lg px-4 py-3 pr-10 text-sm ${error ? 'is-invalid' : ''}`}
          onChange={(event) => onChange?.(event.target.value)}
        />
        <button
          type="button"
          className="password-toggle absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent p-0"
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={show}
          onClick={() => setShow((current) => !current)}
        >
          {show ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      </div>
      {error ? (
        <p id={id + '-error'} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
