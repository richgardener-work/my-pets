import { describe, it, expect } from 'vitest'
import { computeScoreUpdate } from '../utils/scoreLogic'

describe('computeScoreUpdate', () => {
  it('first solve: starsToAdd=1 for 3x3, isFirst=true, best fields = current', () => {
    const r = computeScoreUpdate(null, { moves: 30, timeSeconds: 60, difficulty: '3x3' })
    expect(r.starsToAdd).toBe(1)
    expect(r.isFirst).toBe(true)
    expect(r.bestMoves).toBe(30)
    expect(r.bestTimeSeconds).toBe(60)
  })

  it('first solve: starsToAdd=2 for 4x4', () => {
    const r = computeScoreUpdate(null, { moves: 50, timeSeconds: 120, difficulty: '4x4' })
    expect(r.starsToAdd).toBe(2)
  })

  it('first solve: starsToAdd=3 for 5x5', () => {
    const r = computeScoreUpdate(null, { moves: 80, timeSeconds: 240, difficulty: '5x5' })
    expect(r.starsToAdd).toBe(3)
  })

  it('replay with worse result: bestMoves/bestTimeSeconds keep prior values', () => {
    const prev = { bestMoves: 20, bestTimeSeconds: 40 }
    const r = computeScoreUpdate(prev, { moves: 30, timeSeconds: 60, difficulty: '3x3' })
    expect(r.bestMoves).toBe(20)
    expect(r.bestTimeSeconds).toBe(40)
    expect(r.isFirst).toBe(false)
  })

  it('replay with better result: best fields update', () => {
    const prev = { bestMoves: 30, bestTimeSeconds: 60 }
    const r = computeScoreUpdate(prev, { moves: 20, timeSeconds: 40, difficulty: '3x3' })
    expect(r.bestMoves).toBe(20)
    expect(r.bestTimeSeconds).toBe(40)
  })

  it('replay always adds full stars (cumulative semantics)', () => {
    const prev = { bestMoves: 20, bestTimeSeconds: 40 }
    const r = computeScoreUpdate(prev, { moves: 30, timeSeconds: 60, difficulty: '3x3' })
    expect(r.starsToAdd).toBe(1) // not 0, regardless of replay
  })

  it('returns 0 starsToAdd for unknown difficulty (defensive)', () => {
    const r = computeScoreUpdate(null, { moves: 1, timeSeconds: 1, difficulty: '9x9' })
    expect(r.starsToAdd).toBe(0)
  })
})
