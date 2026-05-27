import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCw, X, AlertCircle, PawPrint } from 'lucide-react'
import { usePets } from '../../hooks/usePets'

export default function UploadingCard({ pending, onRetry, onCancel }) {
  const { pets: cats } = usePets()
  const names = (pending.catIds || [])
    .map(id => cats.find(c => c.id === id)?.name)
    .filter(Boolean)

  const [showDelete, setShowDelete] = useState(false)
  const timer = useRef(null)
  const startPos = useRef(null)
  const MOVE_THRESHOLD = 8

  useEffect(() => {
    if (pending.status === 'uploading') setShowDelete(false)
  }, [pending.status])

  useEffect(() => {
    if (!showDelete) return
    const onDocClick = () => setShowDelete(false)
    const onKey = (e) => { if (e.key === 'Escape') setShowDelete(false) }
    const t = setTimeout(() => document.addEventListener('click', onDocClick), 0)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [showDelete])

  const start = (e) => {
    if (pending.status !== 'error') return
    const t = e.touches?.[0]
    startPos.current = t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY }
    timer.current = setTimeout(() => { setShowDelete(true) }, 500)
  }
  const move = (e) => {
    if (!timer.current || !startPos.current) return
    const t = e.touches?.[0]
    const cx = t ? t.clientX : e.clientX
    const cy = t ? t.clientY : e.clientY
    if (Math.abs(cx - startPos.current.x) > MOVE_THRESHOLD ||
        Math.abs(cy - startPos.current.y) > MOVE_THRESHOLD) cancel()
  }
  const cancel = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    startPos.current = null
  }

  return (
    <div className="relative">
      <motion.div
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={cancel}
        onMouseLeave={cancel}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={cancel}
        onTouchCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        className="relative flex w-full flex-col rounded-md bg-light-cream p-2 pb-8 shadow-md dark:bg-dark-card dark:shadow-2xl select-none"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-black/10 dark:bg-white/5">
          {pending.previewUrl && (
            <img
              src={pending.previewUrl}
              alt=""
              className={`h-full w-full object-cover ${pending.status === 'error' ? 'opacity-30' : 'opacity-50'}`}
            />
          )}
          {pending.status === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-white/70" />
            </div>
          )}
          {pending.status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <AlertCircle size={24} className="text-red-400" />
              <span className="text-xs text-red-400">Failed to upload</span>
            </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 grid h-8 place-items-center">
          {names.length > 0 ? (
            <span className="font-hand text-xl leading-none text-[#E879B4]">{names.join(' · ')}</span>
          ) : (
            <PawPrint size={20} className="text-[#E879B4]" aria-label="Untagged" />
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {pending.status === 'error' && !showDelete && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
            onClick={(e) => { e.stopPropagation(); onRetry(pending.id) }}
            aria-label="Retry upload"
            className="absolute -top-2 -right-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-[#E879B4] text-white shadow-lg"
          >
            <RefreshCw size={12} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDelete && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
            onClick={(e) => { e.stopPropagation(); onCancel(pending.id); setShowDelete(false) }}
            aria-label="Cancel upload"
            className="absolute -top-2 -right-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white shadow-lg"
          >
            <X size={14} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
