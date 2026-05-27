import { AnimatePresence, motion } from 'framer-motion'
import { Star, Home, LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function VictoryOverlay({ open, stars, moves, seconds }) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
          {!reduce && <Confetti count={60} />}

          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: { type: 'spring', stiffness: 240, damping: 22 },
            }}
            className="relative w-[360px] rounded-3xl bg-light-cream p-8 text-center shadow-2xl dark:bg-dark-card"
          >
            <h2 className="font-display font-wonky text-3xl">🎉 Solved!</h2>

            <div className="mt-4 flex justify-center gap-1">
              {Array.from({ length: 3 }, (_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, y: -20, opacity: 0 }}
                  animate={{
                    scale: 1,
                    y: 0,
                    opacity: 1,
                    transition: {
                      delay: 0.12 * i,
                      type: 'spring',
                      stiffness: 300,
                      damping: 18,
                    },
                  }}
                >
                  <Star
                    size={32}
                    className={i < stars ? 'fill-[#E879B4] text-[#E879B4]' : 'opacity-30'}
                  />
                </motion.span>
              ))}
            </div>

            <div className="mt-6 flex justify-around text-sm opacity-80">
              <div>⏱ {seconds}s</div>
              <div>👣 {moves} moves</div>
            </div>

            <div className="mt-6 flex gap-2">
              <Link
                to="/gallery"
                className="flex-1 rounded-full border border-current px-4 py-2 text-sm inline-flex items-center justify-center gap-1 opacity-80 hover:opacity-100"
              >
                <Home size={14} /> Gallery
              </Link>
              <Link
                to="/games"
                className="flex-1 rounded-full bg-[#E879B4] px-4 py-2 text-white text-sm inline-flex items-center justify-center gap-1"
              >
                <LayoutGrid size={14} /> All games
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Confetti({ count }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    x: Math.random() * 100,
    delay: Math.random() * 0.4,
    color: ['#E879B4', '#C9A0DC', '#C77DFF', '#FFDB7A'][i % 4],
    rotate: Math.random() * 360,
  }))

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-20px] h-3 w-1.5 rounded-sm animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
