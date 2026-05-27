export function pickRandomPuzzle({ photos, getScore, uid, difficulty, random = Math.random }) {
  if (!photos || photos.length === 0) return null
  const unsolved = photos.filter((p) => (getScore(uid, p.id, difficulty)?.stars ?? 0) === 0)
  const pool = unsolved.length > 0 ? unsolved : photos
  const idx = Math.floor(random() * pool.length)
  return pool[Math.min(idx, pool.length - 1)]
}
