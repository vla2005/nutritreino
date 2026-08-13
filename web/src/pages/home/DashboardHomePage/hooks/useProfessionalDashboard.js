import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/composables/useToast.jsx'

export function useProfessionalDashboard(fetchDashboard) {
  const toast = useToast()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async ({ notifyError = true } = {}) => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchDashboard()
      setDashboard(data)
      return data
    } catch (requestError) {
      setError(requestError.message)
      if (notifyError) toast.warning(requestError.message)
      throw requestError
    } finally {
      setLoading(false)
    }
  }, [fetchDashboard, toast])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const data = await fetchDashboard()
        if (active) setDashboard(data)
      } catch (requestError) {
        if (active) {
          setError(requestError.message)
          toast.warning(requestError.message)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [fetchDashboard, toast])

  return { dashboard, error, loading, refresh, setDashboard }
}
