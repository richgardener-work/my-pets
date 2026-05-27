import { describe, it, expect, vi } from 'vitest'
import { pickRandomPuzzle } from '../utils/pickRandomPuzzle'

const photo = (id) => ({ id, imageUrl: 'x' })

describe('pickRandomPuzzle', () => {
  it('returns null when photos is empty', () => {
    const result = pickRandomPuzzle({
      photos: [],
      getScore: () => null,
      uid: 'u',
      difficulty: '3x3',
    })
    expect(result).toBeNull()
  })

  it('prefers an unsolved photo at the given difficulty', () => {
    const photos = [photo('a'), photo('b'), photo('c')]
    const getScore = (uid, id, d) => {
      if (id === 'a' && d === '3x3') return { stars: 3 }
      if (id === 'b' && d === '3x3') return { stars: 2 }
      return null
    }
    const result = pickRandomPuzzle({ photos, getScore, uid: 'u', difficulty: '3x3' })
    expect(result.id).toBe('c')
  })

  it('falls back to any photo when all are solved', () => {
    const photos = [photo('a'), photo('b')]
    const getScore = () => ({ stars: 3 })
    const result = pickRandomPuzzle({ photos, getScore, uid: 'u', difficulty: '3x3' })
    expect(['a', 'b']).toContain(result.id)
  })

  it('uses the provided random source for unsolved set', () => {
    const photos = [photo('a'), photo('b'), photo('c')]
    const getScore = () => null
    expect(pickRandomPuzzle({ photos, getScore, uid: 'u', difficulty: '3x3', random: () => 0 }).id).toBe('a')
    expect(pickRandomPuzzle({ photos, getScore, uid: 'u', difficulty: '3x3', random: () => 0.99 }).id).toBe('c')
  })
})
