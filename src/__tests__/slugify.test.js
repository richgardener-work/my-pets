// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { slugify, findAvailableSlug } from '../utils/slugify.js'

describe('slugify', () => {
  it('lowercases and kebab-cases plain ASCII', () => {
    expect(slugify('Nick')).toBe('nick')
    expect(slugify('Lord Whiskers')).toBe('lord-whiskers')
  })
  it('transliterates Cyrillic', () => {
    expect(slugify('Муся')).toBe('musya')
    expect(slugify('Жужа')).toBe('zhuzha')
  })
  it('drops special chars', () => {
    expect(slugify('Mr. Bigglesworth!')).toBe('mr-bigglesworth')
  })
  it('falls back to "cat" on empty', () => {
    expect(slugify('')).toBe('')  // empty in, empty out
    expect(slugify('!!!')).toBe('cat')
  })
  it('caps at 40 chars', () => {
    expect(slugify('a'.repeat(80)).length).toBeLessThanOrEqual(40)
  })
})

describe('findAvailableSlug', () => {
  it('returns base when free', async () => {
    const slug = await findAvailableSlug('Nick', async () => false)
    expect(slug).toBe('nick')
  })
  it('appends -2 on collision', async () => {
    const taken = new Set(['nick'])
    const slug = await findAvailableSlug('Nick', async (s) => taken.has(s))
    expect(slug).toBe('nick-2')
  })
  it('walks through numbers on repeated collisions', async () => {
    const taken = new Set(['nick', 'nick-2', 'nick-3'])
    const slug = await findAvailableSlug('Nick', async (s) => taken.has(s))
    expect(slug).toBe('nick-4')
  })
})
