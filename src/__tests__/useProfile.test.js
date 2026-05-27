import { describe, test, expect } from 'vitest'
import { buildLeaderboard } from '../hooks/useProfile'

describe('buildLeaderboard', () => {
  test('filters out non-allowed users', () => {
    const users = [
      { uid: '1', allowed: true,  totalStars: 10 },
      { uid: '2', allowed: false, totalStars: 99 },
    ]
    expect(buildLeaderboard(users)).toHaveLength(1)
    expect(buildLeaderboard(users)[0].uid).toBe('1')
  })

  test('sorts by totalStars descending', () => {
    const users = [
      { uid: 'a', allowed: true, totalStars: 5  },
      { uid: 'b', allowed: true, totalStars: 20 },
      { uid: 'c', allowed: true, totalStars: 12 },
    ]
    expect(buildLeaderboard(users).map(u => u.uid)).toEqual(['b', 'c', 'a'])
  })

  test('treats missing totalStars as 0', () => {
    const users = [
      { uid: 'x', allowed: true },
      { uid: 'y', allowed: true, totalStars: 3 },
    ]
    const result = buildLeaderboard(users)
    expect(result[0].uid).toBe('y')
    expect(result[1].uid).toBe('x')
  })
})
