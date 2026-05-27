import { useSyncExternalStore } from 'react'

const listeners = new Set()
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
const emit = () => listeners.forEach(fn => fn())

const THEME_COLOR_LIGHT = '#FDF5ED'
const THEME_COLOR_DARK = '#0A0414'

const syncThemeColor = (isDark) => {
  if (typeof document === 'undefined') return
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isDark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT)
}

let dark = (() => {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem('theme')
  if (stored !== null) return stored === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})()

if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', dark)
  syncThemeColor(dark)
}

const toggle = () => {
  dark = !dark
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    syncThemeColor(dark)
  }
  emit()
}

const getSnapshot = () => dark
const getServerSnapshot = () => false

export function useTheme() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return { dark: value, toggle }
}
