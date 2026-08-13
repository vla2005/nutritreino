import { useState } from 'react'

export default function PasswordInput({ value = '', label = 'Senha', placeholder = '********', showForgot = true, error = '', onChange }) {
  const [show, setShow] = useState(false)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="form-label !mb-0">{label}</label>
        {showForgot ? (
          <a href="#" className="forgot-link">
            Esqueci minha senha
          </a>
        ) : null}
      </div>
      <div className="relative">
        <LockIcon />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          className={`input-field has-leading-icon rounded-lg px-4 py-3 pr-10 text-sm ${error ? 'is-invalid' : ''}`}
          onChange={(event) => onChange?.(event.target.value)}
        />
        <button
          type="button"
          className="password-toggle absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent p-0 text-white/40 transition-colors hover:text-white/70"
          tabIndex="-1"
          onClick={() => setShow((current) => !current)}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}

function LockIcon() {
  return (
    <svg className="input-leading-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 10.75h9v7.5h-9z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 10.75V8.5a3 3 0 0 1 6 0v2.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.269 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}
