import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Loader2, Download } from 'lucide-react'
import PlayDifficultyButton from '../../components/PlayDifficultyButton'
import { usePets } from '../../hooks/usePets'
import { usePhotos } from '../../hooks/usePhotos'
import { useTheme } from '../../hooks/useTheme'
import { useModalScrollLock } from '../../hooks/useModalScrollLock'
import { useAuth } from '../../hooks/useAuth'
import { createSession } from '../../utils/sessionTokens'
import PhotoForm from './PhotoForm'

export default function PhotoViewModal({ open, photo, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { dark } = useTheme()
  const { pets: cats } = usePets()
  const [diffOpen, setDiffOpen] = useState(false)
  const dropRef = useRef(null)

  useModalScrollLock(open)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  useEffect(() => { setImgLoaded(false) }, [photo?.id])
  const formRef = useRef(null)
  const { editPhoto } = usePhotos()
  const longPressTimer = useRef(null)
  const longPressFired = useRef(false)
  const longPressStartPos = useRef(null)
  const MOVE_THRESHOLD = 8

  const startLongPress = (e) => {
    if (!photo || photo.isDemo || editing) return
    longPressFired.current = false
    const t = e.touches?.[0]
    longPressStartPos.current = t
      ? { x: t.clientX, y: t.clientY }
      : { x: e.clientX, y: e.clientY }
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      setEditing(true)
      // Auto-reset in case the platform doesn't fire a synthetic click after long press (iOS)
      setTimeout(() => { longPressFired.current = false }, 300)
    }, 500)
  }
  const moveLongPress = (e) => {
    if (!longPressTimer.current || !longPressStartPos.current) return
    const t = e.touches?.[0]
    const cx = t ? t.clientX : e.clientX
    const cy = t ? t.clientY : e.clientY
    const dx = cx - longPressStartPos.current.x
    const dy = cy - longPressStartPos.current.y
    if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) cancelLongPress()
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    longPressStartPos.current = null
  }

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (!diffOpen) return
      if (!dropRef.current?.contains(e.target)) setDiffOpen(false)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (diffOpen) { setDiffOpen(false); return }
      if (editing) { setEditing(false); return }
      onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', onDoc), 0)
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, diffOpen, editing, onClose])

  useEffect(() => {
    if (!open) setEditing(false)
  }, [open])

  useEffect(() => {
    setEditing(false)
  }, [photo?.id])

  if (!photo) return null

  const catNames = (photo.catIds || [])
    .map(id => cats.find(c => c.id === id)?.name)
    .filter(Boolean)

  const validCatIds = (photo.catIds || []).filter(id => cats.some(c => c.id === id))

  const close = () => {
    if (editing) { setEditing(false); return }
    setDiffOpen(false)
    onClose()
  }

  const handleSave = async (e) => {
    e.stopPropagation()
    setSaving(true)
    const ok = await formRef.current?.submit()
    setSaving(false)
    if (ok) setEditing(false)
  }

  const handleEditSubmit = async ({ catIds, note }) => {
    await editPhoto(photo, { catIds, note })
  }

  const handleDownload = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const res = await fetch(photo.imageUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = photo.originalFilename ?? `photo-${photo.id}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePlay = async (difficulty) => {
    close()
    try {
      const sessionId = await createSession({
        uid: user?.uid ?? 'guest',
        type: 'game',
        payload: { photoId: photo.id, difficulty },
      })
      navigate(`/games/${sessionId}`)
    } catch {
      console.error('Failed to create session from gallery')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close}
        >
          <div className="absolute inset-0 bg-[rgba(10,4,20,0.7)] backdrop-blur-md"/>
          <motion.div
            onClick={(e) => {
              if (longPressFired.current) {
                longPressFired.current = false
                e.stopPropagation()
                return
              }
              if (editing) {
                setEditing(false)
                return
              }
              e.stopPropagation()
            }}
            onMouseDown={startLongPress}
            onMouseMove={moveLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchMove={moveLongPress}
            onTouchEnd={cancelLongPress}
            onTouchCancel={cancelLongPress}
            onContextMenu={(e) => { if (photo && !photo.isDemo && !editing) e.preventDefault() }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg rounded-[20px] overflow-hidden shadow-2xl"
            style={{
              background: dark ? 'rgba(26,8,40,0.9)' : 'rgba(255,251,245,0.96)',
              backdropFilter: 'blur(16px)',
              color: dark ? '#F5EEF8' : '#2D1B28',
              border: dark ? '1px solid rgba(199,125,255,0.2)' : '1px solid rgba(232,121,180,0.2)',
            }}
          >
            <button
              onClick={editing ? handleSave : close}
              disabled={saving}
              className={`absolute top-3 right-3 z-10 grid h-8 w-8 place-items-center rounded-full transition-colors ${
                editing
                  ? 'bg-morph text-white shadow-lg disabled:opacity-50'
                  : 'bg-black/30 text-white hover:bg-black/50'
              }`}
              aria-label={editing ? 'Save changes' : 'Close'}
            >
              {editing
                ? (saving ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>)
                : <X size={15}/>}
            </button>

            <div className="relative bg-black">
              {!imgLoaded && (
                <div
                  className="w-full max-h-[70vh] flex items-center justify-center bg-black/5"
                  style={{ aspectRatio: photo.aspectRatio ?? 1 }}
                >
                  <Loader2 size={28} className="animate-spin text-white/40" />
                </div>
              )}
              <img
                src={photo.mediumUrl ?? photo.imageUrl}
                alt=""
                onLoad={() => setImgLoaded(true)}
                className={`w-full max-h-[70vh] object-contain${imgLoaded ? '' : ' hidden'}`}
              />
              {editing ? (
                <button
                  onClick={handleDownload}
                  className="bg-morph absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white transition"
                  style={{ boxShadow: '0 8px 18px rgba(232,121,180,0.35)' }}
                >
                  <Download size={12}/> Download
                </button>
              ) : (
                <div className="absolute bottom-3 right-3" ref={dropRef}>
                  <PlayDifficultyButton
                    open={diffOpen}
                    onOpen={() => setDiffOpen(true)}
                    onSelect={handlePlay}
                  />
                </div>
              )}
            </div>

            <div className="p-5 space-y-3 min-h-[130px] select-none" style={{ WebkitTouchCallout: 'none' }}>
              {editing ? (
                <PhotoForm
                  ref={formRef}
                  mode="edit"
                  initial={{ catIds: validCatIds, note: photo.note ?? '' }}
                  onSubmit={handleEditSubmit}
                />
              ) : (
                <>
                  {catNames.length > 0 && (
                    <div className="text-center">
                      <span className="font-hand text-2xl text-[#E879B4]">{catNames.join(' · ')}</span>
                    </div>
                  )}
                  {photo.note && (
                    <p className="text-left text-sm opacity-70 leading-relaxed">{photo.note}</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
