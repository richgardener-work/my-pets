import { motion, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'

const DIFFS = [
  { label: '3×3', value: '3x3' },
  { label: '4×4', value: '4x4' },
  { label: '5×5', value: '5x5' },
]

const SPRING = { type: 'spring', stiffness: 680, damping: 36 }

export default function PlayDifficultyButton({ open, onOpen, onSelect }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {!open ? (
        <motion.button
          key="play"
          onClick={onOpen}
          className="bg-morph inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white hover:opacity-90"
          style={{ boxShadow: '0 8px 18px rgba(232,121,180,0.35)' }}
          aria-label="Choose difficulty"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={SPRING}
        >
          <Play size={12} /> Play
        </motion.button>
      ) : (
        <motion.div
          key="diffs"
          className="bg-morph inline-flex overflow-hidden rounded-full"
          style={{ boxShadow: '0 8px 18px rgba(232,121,180,0.35)' }}
          initial={{ opacity: 0, scale: 0.92, x: 8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.92, x: 8 }}
          transition={SPRING}
        >
          {DIFFS.map((d, i) => (
            <button
              key={d.value}
              onClick={() => onSelect(d.value)}
              className={`shrink-0 whitespace-nowrap px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20 ${i > 0 ? 'border-l border-white/30' : ''}`}
            >
              {d.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
