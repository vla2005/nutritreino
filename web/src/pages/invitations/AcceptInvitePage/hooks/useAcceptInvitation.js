import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '@/composables/useToast.jsx'
import { acceptClientInvitation, getClientInvitation, validateAcceptInvitePassword } from '@/services/invitations.js'
import { inviteErrorMessage } from '../utils/invitationFormatters.js'

const emptyPassword = { password: '', password_confirmation: '' }

export function useAcceptInvitation() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const token = searchParams.get('token') || ''
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(() => token ? '' : 'Convite invalido. O token nao foi informado.')
  const [form, setForm] = useState(emptyPassword)
  const [errors, setErrors] = useState({})
  const requiresPassword = invite?.requires_password !== false

  useEffect(() => {
    if (!token) return undefined
    let mounted = true

    getClientInvitation(token)
      .then((data) => {
        if (mounted) setInvite(data)
      })
      .catch((requestError) => {
        if (mounted) setError(inviteErrorMessage(requestError.message))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [token])

  function updatePassword(patch) {
    setForm((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      Object.keys(patch).forEach((key) => delete next[key])
      return next
    })
  }

  async function submit() {
    const nextErrors = requiresPassword ? validateAcceptInvitePassword(form) : {}
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      toast.warning('Revise os campos destacados.')
      return
    }

    try {
      setSaving(true)
      await acceptClientInvitation({ token, ...(requiresPassword ? form : {}) })
      toast.success(requiresPassword ? 'Senha criada com sucesso.' : 'Convite aceito com sucesso.')
      window.setTimeout(() => navigate('/login'), 500)
    } catch (requestError) {
      setErrors(requestError.fieldErrors || {})
      toast.warning(Object.values(requestError.fieldErrors || {})[0] || inviteErrorMessage(requestError.message))
    } finally {
      setSaving(false)
    }
  }

  return {
    client: invite?.client,
    error,
    errors,
    form,
    loading,
    professional: invite?.professional,
    requiresPassword,
    saving,
    submit,
    updatePassword,
  }
}
