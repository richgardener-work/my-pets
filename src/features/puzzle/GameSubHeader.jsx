import { useLayoutEffect, useState } from 'react'
import { Shuffle, Timer, Footprints, Wand2 } from 'lucide-react'
import CountUp from '../../components/CountUp'
import { useTheme } from '../../hooks/useTheme'

const SUBHEADER_GAP = 4

const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function GameSubHeader({ seconds, moves, solveEnabled, autoSolving, onShuffle, onSolve }) {
  const { dark } = useTheme()
  const [stickyTop, setStickyTop] = useState(SUBHEADER_GAP)

  useLayoutEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const update = () => setStickyTop(header.offsetHeight + SUBHEADER_GAP)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const glass = {
    background: dark ? 'rgba(15,5,24,0.58)' : 'rgba(255,251,245,0.72)',
    backdropFilter: 'blur(12px) saturate(160%)',
    WebkitBackdropFilter: 'blur(12px) saturate(160%)',
    boxShadow: dark
      ? '0 4px 16px rgba(0,0,0,0.4)'
      : '0 4px 16px rgba(0,0,0,0.09)',
  }

  return (
    <div className="sticky z-[29] px-4 pb-2" style={{ top: stickyTop }}>
      <div className="flex items-center justify-center gap-2">

        {/* Stats pill */}
        <div
          className="flex items-center gap-4 rounded-full border border-pink-300/20 dark:border-purple-300/20 px-4 h-10"
          style={glass}
        >
          <div className="flex items-center gap-1.5">
            <Timer size={14} className="text-light-pink dark:text-dark-purple" />
            <span className="font-mono tabular-nums text-sm font-semibold">
              {formatTime(seconds)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Footprints size={14} className="text-light-pink dark:text-dark-purple" />
            <CountUp value={moves} className="font-mono tabular-nums text-sm font-semibold" />
            <span className="hidden sm:inline text-xs opacity-50">moves</span>
          </div>
        </div>

        {/* Buttons pill */}
        <div
          className="flex items-center gap-1.5 rounded-full border border-pink-300/20 dark:border-purple-300/20 px-3 h-10"
          style={glass}
        >
          <button
            aria-label="Shuffle"
            onClick={onShuffle}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <Shuffle size={13} />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
          {solveEnabled && (
            <button
              aria-label="Solve"
              onClick={onSolve}
              disabled={autoSolving}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Wand2 size={13} />
              <span className="hidden sm:inline">Solve</span>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
