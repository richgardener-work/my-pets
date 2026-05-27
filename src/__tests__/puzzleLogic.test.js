// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  createSolvedState,
  isSolved,
  getBlankPos,
  getValidMoves,
  applyMove,
  shuffle,
  getStarsForDifficulty,
} from '../features/puzzle/puzzleLogic'

describe('createSolvedState', () => {
  it('creates a 3x3 array 0..8', () => {
    expect(createSolvedState(3)).toEqual([1,2,3,4,5,6,7,8,0])
  })
  it('places blank (0) at the last position', () => {
    const s = createSolvedState(4)
    expect(s[15]).toBe(0)
  })
})

describe('isSolved', () => {
  it('returns true for solved state', () => {
    expect(isSolved(createSolvedState(3), 3)).toBe(true)
  })
  it('returns false when not solved', () => {
    const s = [1,0,2,3,4,5,6,7,8]
    expect(isSolved(s, 3)).toBe(false)
  })
})

describe('getBlankPos', () => {
  it('finds blank (0) index', () => {
    expect(getBlankPos([1,2,3,0,5,6,7,8,9], 3)).toEqual({ row: 1, col: 0 })
  })
})

describe('getValidMoves', () => {
  it('returns 2 moves for corner blank', () => {
    const state = [0,1,2,3,4,5,6,7,8]
    expect(getValidMoves(state, 3).length).toBe(2)
  })
  it('returns 4 moves for center blank', () => {
    const state = [1,2,3,4,0,5,6,7,8]
    expect(getValidMoves(state, 3).length).toBe(4)
  })
})

describe('applyMove', () => {
  it('swaps tile with blank', () => {
    const state = [1,2,3,4,0,5,6,7,8]
    const result = applyMove(state, 3, 3)
    expect(result[3]).toBe(0)
    expect(result[4]).toBe(4)
  })
  it('does not mutate original state', () => {
    const state = [1,2,3,4,0,5,6,7,8]
    applyMove(state, 3, 3)
    expect(state[4]).toBe(0)
  })
})

describe('shuffle', () => {
  it('returns a solvable state', () => {
    const s = shuffle(3, 100)
    expect(s.length).toBe(9)
    expect(s.filter(v => v === 0).length).toBe(1)
  })
  it('returns shuffled state (not solved)', () => {
    const solved = createSolvedState(3)
    const shuffled = shuffle(3, 100)
    expect(shuffled).not.toEqual(solved)
  })
})

describe('getStarsForDifficulty', () => {
  it('returns 1 for 3x3', () => expect(getStarsForDifficulty('3x3')).toBe(1))
  it('returns 2 for 4x4', () => expect(getStarsForDifficulty('4x4')).toBe(2))
  it('returns 3 for 5x5', () => expect(getStarsForDifficulty('5x5')).toBe(3))
})
