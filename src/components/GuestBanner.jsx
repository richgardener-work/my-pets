import { LogIn } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export default function GuestBanner({ show, onSignIn, theme }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-[80px] left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-medium shadow-lg"
          style={{
            background: theme === 'dark' ? 'rgba(26,8,40,0.85)' : 'rgba(255,251,245,0.95)',
            color: theme === 'dark' ? '#F5EEF8' : '#2D1B28',
            border: theme === 'dark' ? '1px solid rgba(199,125,255,0.25)' : '1px solid rgba(232,121,180,0.25)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span className="opacity-80">Guest mode — your data stays on this device.</span>
          <button
            onClick={onSignIn}
            className="ml-3 inline-flex items-center gap-1 rounded-full bg-[#E879B4] px-3 py-1 text-white hover:-translate-y-0.5 transition"
          >
            <LogIn size={12} /> Sign in
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
