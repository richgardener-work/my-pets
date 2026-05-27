import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ImageOff, PawPrint } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { guest } from '../utils/guestStorage'
import { useAuth } from '../hooks/useAuth'
import { usePets } from '../hooks/usePets'
import PuzzleBoard from '../features/puzzle/PuzzleBoard'
import VictoryOverlay from '../features/puzzle/VictoryOverlay'
import GameSubHeader from '../features/puzzle/GameSubHeader'
import {
  shuffle, applyMove, isSolved, getStarsForDifficulty, autoSolveMoves
} from '../features/puzzle/puzzleLogic'

const GRID_SIZE = { '3x3': 3, '4x4': 4, '5x5': 5 }

export default function GameScreen({ auth, games }) {
  const { photoId, difficulty } = useParams()
  const navigate = useNavigate()
  const n = GRID_SIZE[difficulty] || 3

  const { user, userDoc, isAuthorized } = useAuth()
  const solveEnabled = !isAuthorized || userDoc?.admin === true

  const [photo, setPhoto] = useState(null)
  const [state, setState] = useState(() => shuffle(n))
  const stateRef = useRef(state)
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(true)
  const [won, setWon] = useState(false)
  const [autoSolving, setAutoSolving] = useState(false)
  const [imgStatus, setImgStatus] = useState('loading')

  const puzzleContainerRef = useRef(null)
  const [puzzleArea, setPuzzleArea] = useState({ w: 0, h: 0 })

  const { pets: cats } = usePets(auth.isAuthorized)
  const { saveScore } = games

  useEffect(() => {
    if (photoId.startsWith('guest-')) {
      const guestPhoto = guest.getPhotos().find(p => p.id === photoId)
      if (guestPhoto) setPhoto(guestPhoto)
      return
    }

    getDoc(doc(db, 'photos', photoId)).then(snap => {
      if (snap.exists()) setPhoto({ id: snap.id, ...snap.data() })
    })
  }, [photoId])

  useEffect(() => {
    if (!photo) return
    setImgStatus('loading')
    const url = photo.mediumUrl ?? photo.imageUrl
    if (!url) { setImgStatus('error'); return }
    const img = new Image()
    // iOS/Safari PWA: onerror may not fire when offline via Service Worker.
    // Fallback timeout ensures we don't hang forever.
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
    const next = applyMove(stateRef.current, n, tileIdx)
    stateRef.current = next
    setState(next)
    setMoves(m => m + 1)
    if (isSolved(next, n)) {
      setRunning(false)
      setWon(true)
    }
  }, [n])

  useEffect(() => {
    if (!won) return
    saveScore(auth.user?.uid ?? 'guest', photoId, difficulty, {
      moves,
      timeSeconds: seconds,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won])

  const handleShuffle = () => {
    const next = shuffle(n)
    stateRef.current = next
    setState(next)
    setMoves(0)
    setSeconds(0)
    setRunning(true)
    setWon(false)
  }

  const handleAutoSolve = async () => {
    if (autoSolving || !solveEnabled) return
    setAutoSolving(true)
    const movesToMake = autoSolveMoves(stateRef.current, n)
    for (const move of movesToMake) {
      await new Promise(r => setTimeout(r, n <= 3 ? 200 : n === 4 ? 100 : 60))
      handleMove(move)
    }
    setAutoSolving(false)
  }

  const catNames = photo
    ? cats.filter(c => photo.catIds?.includes(c.id)).map(c => c.name).join(' · ')
    : ''

  if (!photo || imgStatus === 'loading') {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center px-4 py-3 border-b border-light-pink/20 dark:border-dark-purple/20">
          <button
            onClick={() => navigate('/games')}
            className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
          >
            <ChevronLeft size={18} />
            Back
          </button>
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
        <p className="text-sm opacity-60">Не удалось загрузить изображение</p>
        <button
          onClick={() => navigate('/games')}
          className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
        >
          <ChevronLeft size={18} />
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Back / title bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-light-pink/20 dark:border-dark-purple/20">
        <button
          onClick={() => navigate('/games')}
          className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <div className="text-center">
          {catNames ? (
            <p className="font-heading font-semibold text-sm">{catNames}</p>
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
        solveEnabled={solveEnabled}
        autoSolving={autoSolving}
        onShuffle={handleShuffle}
        onSolve={handleAutoSolve}
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
      />
    </div>
  )
}
