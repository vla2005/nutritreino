import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

const THEME_KEY = 'theme'
let theme = 'dark'
let initialized = false
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return theme
}

function applyTheme(value) {
  theme = value
  document.documentElement.dataset.theme = value
  localStorage.setItem(THEME_KEY, value)
  emit()
}

function initTheme() {
  if (initialized || typeof window === 'undefined') return

  initialized = true
  const savedTheme = localStorage.getItem(THEME_KEY)
  const preferredTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'

  applyTheme(savedTheme ?? preferredTheme)
}

export function useTheme() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    initTheme()
  }, [])

  const toggleTheme = useCallback(() => {
    applyTheme(value === 'dark' ? 'light' : 'dark')
  }, [value])

  return useMemo(
    () => ({
      theme: value,
      isDark: value === 'dark',
      toggleTheme,
    }),
    [toggleTheme, value],
  )
}
