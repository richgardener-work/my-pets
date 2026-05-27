import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import Logo from './Logo'
import { useEffect } from 'react'
import { useModalScrollLock } from '../hooks/useModalScrollLock'

export default function AuthModal({ open, onClose, onGoogle, pending, theme }) {
  useModalScrollLock(open)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[rgba(10,4,20,0.6)] backdrop-blur-md" />
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-[380px] max-w-full rounded-[20px] p-[36px_30px_30px] shadow-2xl"
            style={{
              background: theme === 'dark' ? 'rgba(26,8,40,0.85)' : 'rgba(255,251,245,0.95)',
              backdropFilter: 'blur(16px) saturate(180%)',
              border: theme === 'dark' ? '1px solid rgba(199,125,255,0.2)' : '1px solid rgba(232,121,180,0.2)',
              color: theme === 'dark' ? '#F5EEF8' : '#2D1B28',
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <Logo theme={theme} size={64} glow={theme === 'dark'} />
              <h2 className="font-display font-wonky mt-5 text-[28px] leading-tight">Welcome back.</h2>
              <p className="mt-2 text-sm opacity-70 leading-relaxed">
                Sign in to sync your photos, cats and puzzle scores across your devices.
              </p>

              <button
                onClick={onGoogle}
                disabled={pending}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              >
                <GoogleG />
                {pending ? 'Opening Google…' : 'Continue with Google'}
              </button>

              <p className="mt-5 text-xs opacity-55 leading-relaxed">
                Only invited emails can access the private album. Guests can explore the demo cat and play a sample puzzle.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84c-.21 1.13-.84 2.09-1.79 2.73v2.27h2.9c1.7-1.56 2.69-3.87 2.69-6.65z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.9-2.27c-.8.54-1.83.87-3.06.87-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC04" d="M3.95 10.71A5.41 5.41 0 0 1 3.67 9c0-.6.1-1.18.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z"/>
    </svg>
  )
}
