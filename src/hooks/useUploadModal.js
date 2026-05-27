import { useSyncExternalStore } from 'react'

let state = { open: false }
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const getSnapshot = () => state

export function openUploadModal() {
  if (state.open) return
  state = { open: true }
  emit()
}

export function closeUploadModal() {
  if (!state.open) return
  state = { open: false }
  emit()
}

export function useUploadModal() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
