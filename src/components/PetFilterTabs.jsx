import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, PawPrint } from 'lucide-react'
import { UNTAGGED } from '../utils/photoFilter'

export default function PetFilterTabs({ cats = [], activeId, onChange, onAddCat, onRemoveCat }) {
  const [pending, setPending] = useState(false)
  const [draft, setDraft] = useState('')
  const [removingId, setRemovingId] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!removingId) return
    const onDocClick = () => setRemovingId(null)
    const onKey = (e) => { if (e.key === 'Escape') setRemovingId(null) }
    const t = setTimeout(() => document.addEventListener('click', onDocClick), 0)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [removingId])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const target = container.querySelector('[data-active="true"]')
    if (!target) return
    const cRect = container.getBoundingClientRect()
    const tRect = target.getBoundingClientRect()
    const pad = 16
    if (tRect.left < cRect.left + pad) {
      container.scrollBy({ left: tRect.left - cRect.left - pad, behavior: 'auto' })
    } else if (tRect.right > cRect.right - pad) {
      container.scrollBy({ left: tRect.right - cRect.right + pad, behavior: 'auto' })
    }
  }, [activeId, cats.length])

  const submit = async () => {
    const name = draft.trim()
    if (!name) return setPending(false)
    await onAddCat(name)
    setDraft('')
    setPending(false)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex shrink-0 items-center gap-2">
        <TabPill active={activeId === null} onClick={() => onChange(null)}>All</TabPill>
        <TabPill
          active={activeId === UNTAGGED}
          onClick={() => onChange(UNTAGGED)}
          ariaLabel="Untagged photos"
        >
          <PawPrint size={14} aria-hidden="true"/>
        </TabPill>
      </div>
      <div
        ref={scrollRef}
        className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%)',
        }}
      >
        {cats.map(cat => (
          <TabPill
            key={cat.id}
            active={activeId === cat.id}
            isRemoving={removingId === cat.id}
            onClick={() => {
              if (removingId) { setRemovingId(null); return }
              onChange(cat.id)
            }}
            onLongPress={onRemoveCat ? () => setRemovingId(cat.id) : undefined}
            onRemove={onRemoveCat ? () => { onRemoveCat(cat.id); setRemovingId(null) } : undefined}
          >
            {cat.name}
          </TabPill>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {pending ? (
          <div className="flex items-center gap-2 rounded-full border border-dashed border-[#E879B4] px-3 py-1.5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' ? submit() : e.key === 'Escape' && setPending(false)}
              onBlur={submit}
              placeholder="name"
              className="w-24 bg-transparent outline-none"
              style={{ fontSize: '16px' }}
            />
          </div>
        ) : (
          <button
            onClick={() => setPending(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-current px-3 py-1.5 text-sm opacity-60 hover:opacity-100 transition"
          >
            <Plus size={14}/> New pet
          </button>
        )}
      </div>
    </div>
  )
}

function TabPill({ active, onClick, onLongPress, onRemove, isRemoving, children, ariaLabel }) {
  const timer = useRef(null)
  const fired = useRef(false)
  const startPos = useRef(null)
  const MOVE_THRESHOLD = 8

  const start = (e) => {
    fired.current = false
    if (!onLongPress) return
    const t = e.touches?.[0]
    startPos.current = t
      ? { x: t.clientX, y: t.clientY }
      : { x: e.clientX, y: e.clientY }
    timer.current = setTimeout(() => {
      fired.current = true
      onLongPress()
    }, 500)
  }
  const move = (e) => {
    if (!timer.current || !startPos.current) return
    const t = e.touches?.[0]
    const cx = t ? t.clientX : e.clientX
    const cy = t ? t.clientY : e.clientY
    const dx = cx - startPos.current.x
    const dy = cy - startPos.current.y
    if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) cancel()
  }
  const cancel = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    startPos.current = null
  }
  const handleClick = (e) => {
    if (fired.current) {
      e.stopPropagation()
      fired.current = false
      return
    }
    onClick?.()
  }

  return (
    <span data-active={active || undefined} className="relative inline-block shrink-0">
      <button
        onClick={handleClick}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={cancel}
        onMouseLeave={cancel}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={cancel}
        onTouchCancel={cancel}
        onContextMenu={(e) => { if (onLongPress) e.preventDefault() }}
        aria-label={ariaLabel}
        className="relative rounded-full px-4 py-1.5 text-sm"
      >
        {active && (
          <motion.span
            layoutId="pet-tab-pill"
            className="bg-morph absolute inset-0 rounded-full"
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          />
        )}
        <span className={`relative ${active ? 'text-white' : 'opacity-75'}`}>{children}</span>
      </button>
      <AnimatePresence>
        {isRemoving && onRemove && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            aria-label="Remove tag"
            className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white shadow-lg z-10"
          >
            <X size={12} strokeWidth={3}/>
          </motion.button>
        )}
      </AnimatePresence>
    </span>
  )
}
