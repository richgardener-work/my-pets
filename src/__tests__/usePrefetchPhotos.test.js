import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrefetchPhotos } from '../hooks/usePrefetchPhotos'

describe('usePrefetchPhotos', () => {
  let createdImages

  beforeEach(() => {
    createdImages = []
    vi.stubGlobal('Image', class {
      constructor() { createdImages.push(this) }
      set src(val) { this._src = val }
      get src() { return this._src }
    })
    let handle = 0
    vi.stubGlobal('requestIdleCallback', (cb) => { cb(); return ++handle })
    vi.stubGlobal('cancelIdleCallback', (id) => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('prefetches mediumUrl for a Firebase photo', () => {
    const photos = [{
      id: 'abc123',
      imageUrl: 'https://firebasestorage.googleapis.com/original.jpg',
      mediumUrl: 'https://firebasestorage.googleapis.com/medium.webp',
    }]
    renderHook(() => usePrefetchPhotos(photos))
    expect(createdImages).toHaveLength(1)
    expect(createdImages[0].src).toBe('https://firebasestorage.googleapis.com/medium.webp')
  })

  it('falls back to imageUrl when mediumUrl is absent', () => {
    const photos = [{
      id: 'abc123',
      imageUrl: 'https://firebasestorage.googleapis.com/original.jpg',
    }]
    renderHook(() => usePrefetchPhotos(photos))
    expect(createdImages).toHaveLength(1)
    expect(createdImages[0].src).toBe('https://firebasestorage.googleapis.com/original.jpg')
  })

  it('skips demo photos', () => {
    const photos = [{
      id: 'demo-1',
      imageUrl: 'https://firebasestorage.googleapis.com/demo.jpg',
      mediumUrl: 'https://firebasestorage.googleapis.com/demo-medium.webp',
    }]
    renderHook(() => usePrefetchPhotos(photos))
    expect(createdImages).toHaveLength(0)
  })

  it('skips guest blob: photos', () => {
    const photos = [{
      id: 'local-xyz',
      imageUrl: 'blob:http://localhost/abc-123',
    }]
    renderHook(() => usePrefetchPhotos(photos))
    expect(createdImages).toHaveLength(0)
  })

  it('does nothing when photos array is empty', () => {
    renderHook(() => usePrefetchPhotos([]))
    expect(createdImages).toHaveLength(0)
  })

  it('prefetches only eligible photos when mixed', () => {
    const photos = [
      { id: 'real-1', imageUrl: 'https://firebasestorage.googleapis.com/a.jpg', mediumUrl: 'https://firebasestorage.googleapis.com/a-medium.webp' },
      { id: 'demo-1', imageUrl: 'https://firebasestorage.googleapis.com/b.jpg' },
      { id: 'real-2', imageUrl: 'blob:http://localhost/xyz' },
    ]
    renderHook(() => usePrefetchPhotos(photos))
    expect(createdImages).toHaveLength(1)
    expect(createdImages[0].src).toBe('https://firebasestorage.googleapis.com/a-medium.webp')
  })
})
