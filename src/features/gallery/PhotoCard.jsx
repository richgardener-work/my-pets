import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { Play, X, PawPrint } from 'lucide-react'
import { usePets } from '../../hooks/usePets'
import { useTouchHoverRegister } from './TouchHoverProvider'

const HOVER_SPRING = { type: 'spring', stiffness: 300, damping: 25 }

export default function PhotoCard({ photo, onOpen, onDelete }) {
  const { pets: cats } = usePets()
  const names = (photo.catIds || [])
    .map(id => cats.find(c => c.id === id)?.name)
    .filter(Boolean)

  const expired = !photo.imageUrl
  const [removing, setRemoving] = useState(false)
  const timer = useRef(null)
  const fired = useRef(false)
  const startPos = useRef(null)
  const MOVE_THRESHOLD = 8

  const y = useMotionValue(0)
  const rotate = useMotionValue(0)
  const register = useTouchHoverRegister()

  useEffect(() => {
    if (register) return register(photo.id, y, rotate)
  }, [photo.id])

  useEffect(() => {
    if (!removing) return
    const onDocClick = () => setRemoving(false)
    const onKey = (e) => { if (e.key === 'Escape') setRemoving(false) }
    const t = setTimeout(() => document.addEventListener('click', onDocClick), 0)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [removing])

  const start = (e) => {
    fired.current = false
    if (!onDelete) return
    const t = e.touches?.[0]
    startPos.current = t
      ? { x: t.clientX, y: t.clientY }
      : { x: e.clientX, y: e.clientY }
    timer.current = setTimeout(() => {
      fired.current = true
      setRemoving(true)
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
    if (removing) { setRemoving(false); return }
    if (!expired) onOpen(photo)
  }

  return (
    <div className="relative">
      <motion.button
        style={{ y, rotate }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={(e) => { if (e?.pointerType === 'touch') return; animate(y, -6, HOVER_SPRING); animate(rotate, -1, HOVER_SPRING) }}
        onHoverEnd={(e) => { if (e?.pointerType === 'touch') return; animate(y, 0, HOVER_SPRING); animate(rotate, 0, HOVER_SPRING) }}
        onClick={handleClick}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={cancel}
        onMouseLeave={cancel}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={cancel}
        onTouchCancel={cancel}
        onContextMenu={(e) => { if (onDelete) e.preventDefault() }}
        data-touch-card-id={photo.id}
        aria-label={expired ? 'Photo expired' : `View photo${names.length ? ` of ${names.join(', ')}` : ''}`}
        className="group relative flex w-full flex-col rounded-md bg-light-cream p-2 pb-8 shadow-md dark:bg-dark-card dark:shadow-2xl"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-black/10 dark:bg-white/5">
          {expired ? (
            <div className="grid h-full w-full place-items-center text-center text-xs opacity-60 p-4">
              Photo expired — reload lost the file. Re-upload to keep it.
            </div>
          ) : (
            <>
              <img src={photo.smallUrl ?? photo.imageUrl} alt="" className="h-full w-full object-cover"/>
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100"/>
              <div aria-hidden className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-white/90 scale-90 transition group-hover:scale-100">
                  <Play size={22} className="text-[#E879B4] ml-0.5"/>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 grid h-8 place-items-center">
          {names.length > 0 ? (
            <span className="font-hand text-xl leading-none text-[#E879B4]">{names.join(' · ')}</span>
          ) : (
            <PawPrint size={20} className="text-[#E879B4]" aria-label="Untagged"/>
          )}
        </div>
      </motion.button>
      <AnimatePresence>
        {removing && onDelete && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
            onClick={(e) => { e.stopPropagation(); onDelete(photo); setRemoving(false) }}
            aria-label="Delete photo"
            className="absolute -top-2 -right-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white shadow-lg"
          >
            <X size={14} strokeWidth={3}/>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
