export function createSolvedState(n) {
  return Array.from({ length: n * n }, (_, i) => (i === n * n - 1 ? 0 : i + 1))
}

export function isSolved(state, n) {
  return state.every((v, i) => v === (i === n * n - 1 ? 0 : i + 1))
}

export function getBlankPos(state, n) {
  const idx = state.indexOf(0)
  return { row: Math.floor(idx / n), col: idx % n }
}

export function getValidMoves(state, n) {
  const blankIdx = state.indexOf(0)
  const row = Math.floor(blankIdx / n)
  const col = blankIdx % n
  const neighbors = []
  if (row > 0) neighbors.push(blankIdx - n)
  if (row < n - 1) neighbors.push(blankIdx + n)
  if (col > 0) neighbors.push(blankIdx - 1)
  if (col < n - 1) neighbors.push(blankIdx + 1)
  return neighbors
}

export function applyMove(state, n, tileIdx) {
  const blankIdx = state.indexOf(0)
  const next = [...state]
  next[blankIdx] = next[tileIdx]
  next[tileIdx] = 0
  return next
}

export function shuffle(n, moves = 200) {
  let state = createSolvedState(n)
  for (let i = 0; i < moves; i++) {
    const valid = getValidMoves(state, n)
    const pick = valid[Math.floor(Math.random() * valid.length)]
    state = applyMove(state, n, pick)
  }
  if (isSolved(state, n)) return shuffle(n, moves)
  return state
}

export function getStarsForDifficulty(difficulty) {
  return { '3x3': 1, '4x4': 2, '5x5': 3 }[difficulty] ?? 1
}

function manhattanDistance(state, n) {
  let d = 0
  for (let i = 0; i < state.length; i++) {
    const v = state[i]
    if (v === 0) continue
    const goal = v - 1
    d += Math.abs(Math.floor(i / n) - Math.floor(goal / n)) + Math.abs((i % n) - (goal % n))
  }
  return d
}

function blankNeighbors(blankIdx, n) {
  const row = Math.floor(blankIdx / n)
  const col = blankIdx % n
  const nb = []
  if (row > 0) nb.push(blankIdx - n)
  if (row < n - 1) nb.push(blankIdx + n)
  if (col > 0) nb.push(blankIdx - 1)
  if (col < n - 1) nb.push(blankIdx + 1)
  return nb
}

export function autoSolveMoves(initialState, n) {
  if (isSolved(initialState, n)) return []

  // Inflated weight: trades optimality for speed on larger grids
  const w = n <= 3 ? 1 : n === 4 ? 2 : 4
  let bound = w * manhattanDistance(initialState, n)
  const result = []

  function search(state, blankIdx, g, prevBlankIdx) {
    const h = manhattanDistance(state, n)
    const f = g + w * h
    if (f > bound) return f
    if (h === 0) return -1

    let min = Infinity
    for (const move of blankNeighbors(blankIdx, n)) {
      if (move === prevBlankIdx) continue
      const next = applyMove(state, n, move)
      result.push(move)
      // after applyMove the blank is now at `move`
      const t = search(next, move, g + 1, blankIdx)
      if (t === -1) return -1
      if (t < min) min = t
      result.pop()
    }
    return min
  }

  const blankIdx = initialState.indexOf(0)
  for (;;) {
    const t = search(initialState, blankIdx, 0, -1)
    if (t === -1) return result
    if (t === Infinity) return []
    bound = t
  }
}
