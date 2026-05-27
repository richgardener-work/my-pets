import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePhotos } from '../../hooks/usePhotos'
import { useTheme } from '../../hooks/useTheme'
import { useModalScrollLock } from '../../hooks/useModalScrollLock'
import PhotoForm from './PhotoForm'

export default function UploadModal({ open, onClose }) {
  const { dark } = useTheme()
  const { uploadPhoto } = usePhotos()
  useModalScrollLock(open)
  const formRef = useRef(null)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    if (!open) return
    setResetKey(k => k + 1)
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleSubmit = ({ file, catIds, note }) => {
    uploadPhoto({ file, catIds, note })
    onClose()
  }

  const handleUploadClick = () => {
    formRef.current?.submit()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[rgba(10,4,20,0.6)] backdrop-blur-md"/>
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-[460px] max-w-full rounded-[20px] p-7 shadow-2xl"
            style={{
              background: dark ? 'rgba(26,8,40,0.9)' : 'rgba(255,251,245,0.96)',
              backdropFilter: 'blur(16px)',
              color: dark ? '#F5EEF8' : '#2D1B28',
              border: dark ? '1px solid rgba(199,125,255,0.2)' : '1px solid rgba(232,121,180,0.2)',
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X size={18}/>
            </button>
            <h2 className="font-display font-wonky text-3xl">Add a photo</h2>

            <PhotoForm
              key={resetKey}
              ref={formRef}
              mode="create"
              initial={{ catIds: [], note: '' }}
              onSubmit={handleSubmit}
            />

            <button
              onClick={handleUploadClick}
              className="bg-morph mt-5 w-full rounded-full py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:opacity-40"
              style={{ boxShadow: '0 10px 30px rgba(232,121,180,0.3)' }}
            >
              Upload photo
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
