import { useState } from 'react'

export default function LoginLogo() {
  const [logoFailed, setLogoFailed] = useState(false)

  return logoFailed ? (
    <svg viewBox="0 0 40 40" fill="none" className="mb-4 h-10 w-10">
      <path d="M6 28L14 12L20 22L26 14L34 28" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <img src="https://merakiui.com/images/logo.svg" alt="Meraki UI" className="mb-4 h-10 w-10" onError={() => setLogoFailed(true)} />
  )
}
