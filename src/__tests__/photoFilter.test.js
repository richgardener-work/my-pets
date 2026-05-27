// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { filterPhotosByTag, UNTAGGED } from '../utils/photoFilter.js'

const photos = [
  { id: '1', catIds: ['muffin'] },
  { id: '2', catIds: ['muffin', 'clove'] },
  { id: '3', catIds: [] },
  { id: '4' },
]

describe('filterPhotosByTag', () => {
  it('returns all photos when active is null', () => {
    expect(filterPhotosByTag(photos, null)).toEqual(photos)
  })

  it('returns photos including the slug when active is a slug', () => {
    expect(filterPhotosByTag(photos, 'muffin').map(p => p.id)).toEqual(['1', '2'])
    expect(filterPhotosByTag(photos, 'clove').map(p => p.id)).toEqual(['2'])
  })

  it('returns only orphan photos when active is UNTAGGED', () => {
    expect(filterPhotosByTag(photos, UNTAGGED).map(p => p.id)).toEqual(['3', '4'])
  })

  it('UNTAGGED sentinel is "__untagged__"', () => {
    expect(UNTAGGED).toBe('__untagged__')
  })
})
