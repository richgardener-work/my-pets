import { createContext, useContext, useEffect, useRef } from 'react'
import { animate } from 'framer-motion'

const Ctx = createContext(null)

const SPRING = { type: 'spring', stiffness: 300, damping: 25 }

export function TouchHoverProvider({ children }) {
  const cards = useRef(new Map())
  const activeId = useRef(null)

  useEffect(() => {
    let rafId = null

    const deactivate = (id) => {
      const card = cards.current.get(id)
      if (!card) return
      animate(card.y, 0, SPRING)
      animate(card.rotate, 0, SPRING)
    }

    const onMove = (e) => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const t = e.touches[0]
        if (!t) return
        const el = document.elementFromPoint(t.clientX, t.clientY)
        const id = el?.closest('[data-touch-card-id]')?.dataset.touchCardId ?? null

        if (id === activeId.current) return

        if (activeId.current) deactivate(activeId.current)

        if (id) {
          const card = cards.current.get(id)
          if (card) {
            animate(card.y, -6, SPRING)
            animate(card.rotate, -1, SPRING)
          }
        }

        activeId.current = id
      })
    }

    const onEnd = () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null }
      if (activeId.current) { deactivate(activeId.current); activeId.current = null }
    }

    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('touchcancel', onEnd)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const register = (id, y, rotate) => {
    cards.current.set(id, { y, rotate })
    return () => cards.current.delete(id)
  }

  return <Ctx.Provider value={register}>{children}</Ctx.Provider>
}

export const useTouchHoverRegister = () => useContext(Ctx)
