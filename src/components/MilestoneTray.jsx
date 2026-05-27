import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Gift } from 'lucide-react'

export default function MilestoneTray({ active, unseenCount, onOpenGift, theme }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!active || active.length === 0) return null

  const isDark = theme === 'dark'

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Gifts (${unseenCount})`}
        className="relative grid h-9 w-9 place-items-center rounded-full text-[#E879B4] hover:bg-black/5 dark:hover:bg-white/10 transition"
      >
        <motion.span
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Gift size={18} />
        </motion.span>
        {unseenCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#E879B4] px-1 text-[10px] font-semibold text-white">
            {unseenCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-2xl shadow-2xl"
            style={{
              background: isDark ? 'rgba(26,8,40,0.92)' : 'rgba(255,251,245,0.97)',
              backdropFilter: 'blur(16px) saturate(180%)',
              border: isDark ? '1px solid rgba(199,125,255,0.2)' : '1px solid rgba(232,121,180,0.2)',
              color: isDark ? '#F5EEF8' : '#2D1B28',
            }}
          >
            <div className="px-4 pt-3 pb-2 text-center">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-50">Gifts</span>
            </div>
            <div
              className="mx-4"
              style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(45,27,40,0.08)' }}
            />
            <ul className="py-2">
              {active.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); onOpenGift(m) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
                  >
                    <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E879B4]/15 text-[#E879B4]">
                      <Gift size={16} />
                      {!m.seen && (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#E879B4]"
                          style={{ boxShadow: `0 0 0 2px ${isDark ? 'rgba(26,8,40,0.92)' : 'rgba(255,251,245,0.97)'}` }}
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">Gift for {m.stars} ★</span>
                      <span className="block text-xs opacity-60">{m.seen ? 'Already opened' : 'Tap to open'}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
