// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { giftCode } from '../utils/giftCode.js'

describe('giftCode', () => {
  it('returns CODE-S{stars} for a numeric milestone', () => {
    expect(giftCode(1)).toBe('CODE-S1')
    expect(giftCode(5)).toBe('CODE-S5')
    expect(giftCode(10)).toBe('CODE-S10')
  })

  it('returns empty string for null/undefined', () => {
    expect(giftCode(null)).toBe('')
    expect(giftCode(undefined)).toBe('')
  })
})
