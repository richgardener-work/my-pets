const STARS_BY_DIFFICULTY = { '3x3': 1, '4x4': 2, '5x5': 3 }

export function computeScoreUpdate(prev, { moves, timeSeconds, difficulty }) {
  const starsToAdd = STARS_BY_DIFFICULTY[difficulty] ?? 0
  const isFirst    = !prev
  const bestMoves       = isFirst ? moves       : Math.min(prev.bestMoves,       moves)
  const bestTimeSeconds = isFirst ? timeSeconds : Math.min(prev.bestTimeSeconds, timeSeconds)
  return { starsToAdd, isFirst, bestMoves, bestTimeSeconds }
}
