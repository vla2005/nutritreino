import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { API_URL } from '../config/api.js'

const TOKEN_KEY = 'auth_token'

let state = {
  user: null,
  loading: false,
  error: null,
}

const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function setState(nextState) {
  state = { ...state, ...nextState }
  emit()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const fetchMe = useCallback(async () => {
    const token = getToken()

    if (!token) {
      setState({ user: null, error: 'Não autenticado' })
      return
    }

    setState({ loading: true, error: null })

    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status === 401) {
        clearToken()
        throw new Error('Não autenticado')
      }

      if (!res.ok) {
        throw new Error('Falha ao carregar usuário')
      }

      const json = await res.json()
      setState({ user: json.data, error: null })
    } catch (error) {
      setState({ user: null, error: error.message })
    } finally {
      setState({ loading: false })
    }
  }, [])

  const login = useCallback(
    async (token) => {
      setToken(token)
      await fetchMe()
    },
    [fetchMe],
  )

  const logout = useCallback(async () => {
    const token = getToken()

    if (token) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
      } catch {
        // Logout local deve acontecer mesmo se o backend estiver indisponível.
      }
    }

    clearToken()
    setState({ user: null, error: null })
  }, [])

  return useMemo(() => {
    const name = snapshot.user?.name ?? ''
    const parts = name.trim().split(/\s+/).filter(Boolean)
    const initials = parts.length
      ? `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''}`.toUpperCase()
      : '?'

    return {
      user: snapshot.user,
      loading: snapshot.loading,
      error: snapshot.error,
      isAuthenticated: Boolean(snapshot.user),
      role: snapshot.user?.role ?? null,
      name,
      fullName: name,
      initials,
      fetchMe,
      login,
      logout,
    }
  }, [fetchMe, login, logout, snapshot])
}
