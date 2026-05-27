import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ImageOff, PawPrint } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import PuzzleBoard from '../features/puzzle/PuzzleBoard'
import VictoryOverlay from '../features/puzzle/VictoryOverlay'
import GameSubHeader from '../features/puzzle/GameSubHeader'
import {
  shuffle, applyMove, isSolved, getStarsForDifficulty,
} from '../features/puzzle/puzzleLogic'

const GRID_SIZE = { '3x3': 3, '4x4': 4, '5x5': 5 }

export default function ShareScreen() {
  const { photoId, difficulty } = useParams()
  const navigate = useNavigate()
  const n = GRID_SIZE[difficulty]

  const [photo, setPhoto] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [state, setState] = useState(() => shuffle(n ?? 3))
  const stateRef = useRef(state)
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(true)
  const [won, setWon] = useState(false)
  const [imgStatus, setImgStatus] = useState('loading')

  const puzzleContainerRef = useRef(null)
  const [puzzleArea, setPuzzleArea] = useState({ w: 0, h: 0 })

  // Redirect if difficulty is invalid
  useEffect(() => {
    if (!n) navigate('/', { replace: true })
  }, [n, navigate])

  useEffect(() => {
    if (!n) return
    getDoc(doc(db, 'photos', photoId)).then(snap => {
      if (snap.exists()) {
        setPhoto({ id: snap.id, ...snap.data() })
      } else {
        setNotFound(true)
      }
    })
  }, [photoId, n])

  useEffect(() => {
    if (!photo) return
    setImgStatus('loading')
    const url = photo.mediumUrl ?? photo.imageUrl
    if (!url) { setImgStatus('error'); return }
    const img = new Image()
    const timer = setTimeout(() => setImgStatus(s => s === 'loading' ? 'error' : s), 5000)
    img.onload = () => { clearTimeout(timer); setImgStatus('ok') }
    img.onerror = () => { clearTimeout(timer); setImgStatus('error') }
    img.src = url
    return () => { clearTimeout(timer); img.onload = null; img.onerror = null }
  }, [photo])

  useLayoutEffect(() => {
    const el = puzzleContainerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    const w = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    const h = rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    if (w > 0 && h > 0) setPuzzleArea({ w, h })
    const obs = new ResizeObserver(entries => {
      const { width: cw, height: ch } = entries[0].contentRect
      if (cw > 0 && ch > 0) setPuzzleArea({ w: cw, h: ch })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [photo, imgStatus])

  useEffect(() => {
    if (!running || won) return
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [running, won])

  const handleMove = useCallback((tileIdx) => {
    if (!n) return
    const next = applyMove(stateRef.current, n, tileIdx)
    stateRef.current = next
    setState(next)
    setMoves(m => m + 1)
    if (isSolved(next, n)) {
      setRunning(false)
      setWon(true)
    }
  }, [n])

  const handleShuffle = () => {
    if (!n) return
    const next = shuffle(n)
    stateRef.current = next
    setState(next)
    setMoves(0)
    setSeconds(0)
    setRunning(true)
    setWon(false)
  }

  const guestCta = (
    <Link
      to="/"
      className="block w-full rounded-full bg-[#E879B4] px-4 py-2.5 text-white text-sm text-center font-medium hover:opacity-90 transition-opacity"
    >
      Upload your own pet →
    </Link>
  )

  const petNames = photo?.catIds?.length
    ? photo.catIds.map(id => id.charAt(0).toUpperCase() + id.slice(1)).join(' · ')
    : ''

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <ImageOff size={32} className="opacity-40" />
        <p className="text-sm opacity-60">Photo not found</p>
        <Link
          to="/"
          className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
        >
          <ChevronLeft size={18} />
          Back
        </Link>
      </div>
    )
  }

  if (!photo || imgStatus === 'loading') {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center px-4 py-3 border-b border-light-pink/20 dark:border-dark-purple/20">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
          >
            <ChevronLeft size={18} />
            Back
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-light-pink dark:border-dark-purple border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  if (imgStatus === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <ImageOff size={32} className="opacity-40" />
        <p className="text-sm opacity-60">Failed to load image</p>
        <Link
          to="/"
          className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
        >
          <ChevronLeft size={18} />
          Back
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Back / title bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-light-pink/20 dark:border-dark-purple/20">
        <Link
          to="/"
          className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
        >
          <ChevronLeft size={18} />
          Back
        </Link>
        <div className="text-center">
          {petNames ? (
            <p className="font-heading font-semibold text-sm">{petNames}</p>
          ) : (
            <PawPrint size={16} className="text-[#E879B4]" aria-label="Untagged" />
          )}
          <p className="text-xs text-light-text/50 dark:text-dark-text/50">
            {difficulty.replace('x', '×')}
          </p>
        </div>
        <div className="w-16" />
      </div>

      {/* Glass game sub-header */}
      <GameSubHeader
        seconds={seconds}
        moves={moves}
        solveEnabled={false}
        autoSolving={false}
        onShuffle={handleShuffle}
        onSolve={() => {}}
      />

      {/* Puzzle — fills all remaining height */}
      <div ref={puzzleContainerRef} className="flex-1 min-h-0 flex items-center justify-center px-4 py-4">
        <PuzzleBoard
          imageUrl={photo.mediumUrl ?? photo.imageUrl}
          state={state}
          n={n}
          onMove={handleMove}
          disabled={won}
          maxW={puzzleArea.w}
          maxH={puzzleArea.h}
        />
      </div>

      <VictoryOverlay
        open={won}
        stars={getStarsForDifficulty(difficulty)}
        moves={moves}
        seconds={seconds}
        guestCta={guestCta}
      />
    </div>
  )
}
