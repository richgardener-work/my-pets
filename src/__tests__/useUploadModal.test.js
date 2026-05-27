import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useUploadModal,
  openUploadModal,
  closeUploadModal,
} from '../hooks/useUploadModal'

describe('useUploadModal', () => {
  beforeEach(() => {
    closeUploadModal()
  })

  it('starts closed', () => {
    const { result } = renderHook(() => useUploadModal())
    expect(result.current.open).toBe(false)
  })

  it('opens on openUploadModal()', () => {
    const { result } = renderHook(() => useUploadModal())
    act(() => openUploadModal())
    expect(result.current.open).toBe(true)
  })

  it('closes on closeUploadModal()', () => {
    const { result } = renderHook(() => useUploadModal())
    act(() => openUploadModal())
    act(() => closeUploadModal())
    expect(result.current.open).toBe(false)
  })

  it('notifies multiple subscribers', () => {
    const a = renderHook(() => useUploadModal())
    const b = renderHook(() => useUploadModal())
    act(() => openUploadModal())
    expect(a.result.current.open).toBe(true)
    expect(b.result.current.open).toBe(true)
  })
})
