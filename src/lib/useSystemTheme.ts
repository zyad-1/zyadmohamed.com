'use client'

import { useEffect, useState } from 'react'

export type ThemeMode = 'dark' | 'light'

/**
 * Automatically follows the user's OS/Device theme (prefers-color-scheme: light | dark),
 * updates live when the OS theme changes, and supports manual toggle in the current session.
 */
export function useSystemTheme(): {
  themeMode: ThemeMode
  toggleThemeMode: () => void
  setThemeMode: (mode: ThemeMode) => void
} {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark')

  const applyDomClasses = (mode: ThemeMode) => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('apx-light-mode', mode === 'light')
    document.documentElement.style.colorScheme = mode
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia('(prefers-color-scheme: light)')
    const sessionOverride = window.sessionStorage.getItem('apx_theme_session_override') as ThemeMode | null

    const initialMode: ThemeMode =
      sessionOverride === 'light' || sessionOverride === 'dark'
        ? sessionOverride
        : mql.matches
          ? 'light'
          : 'dark'

    setThemeModeState(initialMode)
    applyDomClasses(initialMode)

    const handleSystemChange = (e: MediaQueryListEvent) => {
      // Whenever the user changes their OS/system theme, sync automatically
      // and clear any stale manual override so OS preference is respected
      const next: ThemeMode = e.matches ? 'light' : 'dark'
      try {
        window.sessionStorage.removeItem('apx_theme_session_override')
      } catch {}
      setThemeModeState(next)
      applyDomClasses(next)
    }

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleSystemChange)
      return () => mql.removeEventListener('change', handleSystemChange)
    } else {
      mql.addListener(handleSystemChange)
      return () => mql.removeListener(handleSystemChange)
    }
  }, [])

  const setThemeMode = (next: ThemeMode) => {
    setThemeModeState(next)
    applyDomClasses(next)
    try {
      window.sessionStorage.setItem('apx_theme_session_override', next)
    } catch {}
  }

  const toggleThemeMode = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark')
  }

  return { themeMode, toggleThemeMode, setThemeMode }
}
