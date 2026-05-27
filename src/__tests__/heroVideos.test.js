import { describe, it, expect } from 'vitest'
import { pickRandom } from '../utils/heroVideos'

describe('pickRandom', () => {
  it('returns null for empty array', () => {
    expect(pickRandom([])).toBeNull()
  })

  it('returns null for null input', () => {
    expect(pickRandom(null)).toBeNull()
  })

  it('returns the only element for single-item array', () => {
    expect(pickRandom(['a'])).toBe('a')
  })

  it('returns one of the elements for multi-item array', () => {
    const pool = ['x', 'y', 'z']
    const result = pickRandom(pool)
    expect(pool).toContain(result)
  })
})
