import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getValidMoves } from './puzzleLogic'

const GAP = 2
const SPRING = { type: 'spring', stiffness: 400, damping: 28 }

export default function PuzzleBoard({ imageUrl, state, n, onMove, disabled, maxW = 0, maxH = 0 }) {
  const [aspectRatio, setAspectRatio] = useState(1)

  useEffect(() => {
    if (!imageUrl) return
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalHeight / img.naturalWidth)
      }
    }
    img.src = imageUrl
  }, [imageUrl])

  const handleTileClick = useCallback((idx) => {
    if (disabled) return
    const valid = getValidMoves(state, n)
    if (!valid.includes(idx)) return
    onMove(idx)
  }, [state, n, onMove, disabled])

  const containerW = maxW > 0 && maxH > 0 && aspectRatio > 0
    ? Math.min(maxW, maxH / aspectRatio)
    : 0
  const containerH = containerW * aspectRatio
  const tileW = (containerW - GAP * (n - 1)) / n
  const tileH = (containerH - GAP * (n - 1)) / n

  if (containerW === 0) return null

  return (
    <div
      className="mx-auto rounded-2xl shadow-xl overflow-hidden"
      style={{
        width: containerW,
        height: containerH,
        position: 'relative',
        backgroundColor: 'rgba(0,0,0,0.18)',
        touchAction: 'none',
      }}
    >
      {state.map((tileValue, idx) => {
        const isEmpty = tileValue === 0
        const row = Math.floor(idx / n)
        const col = idx % n
        const x = col * (tileW + GAP)
        const y = row * (tileH + GAP)
        const srcRow = isEmpty ? 0 : Math.floor((tileValue - 1) / n)
        const srcCol = isEmpty ? 0 : (tileValue - 1) % n

        return (
          <motion.div
            key={isEmpty ? 'empty' : tileValue}
            animate={{ x, y }}
            transition={SPRING}
            onClick={() => handleTileClick(idx)}
            style={{
              position: 'absolute',
              width: tileW,
              height: tileH,
              left: 0,
              top: 0,
              borderRadius: 4,
              cursor: isEmpty ? 'default' : 'pointer',
              opacity: isEmpty ? 0 : 1,
              userSelect: 'none',
              ...(!isEmpty && imageUrl ? {
                backgroundImage: `url("${imageUrl}")`,
                backgroundSize: `${n * tileW}px ${n * tileH}px`,
                backgroundPosition: `${-(srcCol * tileW)}px ${-(srcRow * tileH)}px`,
                backgroundRepeat: 'no-repeat',
              } : {})
            }}
          />
        )
      })}
    </div>
  )
}
