import { useEffect } from 'react'

export function usePrefetchPhotos(photos) {
  useEffect(() => {
    if (!photos.length) return
    const usingIdleCallback = typeof window.requestIdleCallback === 'function'
    let handle
    if (usingIdleCallback) {
      handle = window.requestIdleCallback(() => {
        for (const photo of photos) {
          if (photo.id.startsWith('demo-')) continue
          if (photo.imageUrl?.startsWith('blob:')) continue
          const img = new Image()
          img.src = photo.mediumUrl ?? photo.imageUrl
        }
      })
    } else {
      handle = setTimeout(() => {
        for (const photo of photos) {
          if (photo.id.startsWith('demo-')) continue
          if (photo.imageUrl?.startsWith('blob:')) continue
          const img = new Image()
          img.src = photo.mediumUrl ?? photo.imageUrl
        }
      }, 200)
    }
    return () => {
      if (usingIdleCallback) window.cancelIdleCallback?.(handle)
      else clearTimeout(handle)
    }
  }, [photos])
}
