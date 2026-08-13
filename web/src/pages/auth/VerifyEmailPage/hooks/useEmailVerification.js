import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_URL } from '@/config/api.js'

export function useEmailVerification() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState(() => token ? 'loading' : 'error')
  const verificationStarted = useRef(false)

  useEffect(() => {
    if (!token || verificationStarted.current) return
    verificationStarted.current = true

    axios
      .post(`${API_URL}/verify-email`, { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return status
}
