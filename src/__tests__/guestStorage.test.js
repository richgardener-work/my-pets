// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'

let guest
beforeEach(async () => {
  localStorage.clear()
  // re-import чтобы сбросить module-level cache
  const mod = await import('../utils/guestStorage.js?bust=' + Math.random())
  guest = mod.guest
})

describe('guest.removeCat', () => {
  it('detaches removed slug from all photo.catIds without deleting photos', () => {
    localStorage.setItem('guestCats', JSON.stringify([
      { id: 'muffin', name: 'Muffin', slug: 'muffin' },
      { id: 'clove',  name: 'Clove',  slug: 'clove' },
    ]))
    localStorage.setItem('guestPhotos', JSON.stringify([
      { id: 'p1', catIds: ['muffin', 'clove'] },
      { id: 'p2', catIds: ['muffin'] },
      { id: 'p3', catIds: ['clove'] },
    ]))

    guest.removeCat('muffin')

    expect(guest.getCats()).toEqual([
      { id: 'clove', name: 'Clove', slug: 'clove' },
    ])
    const photos = JSON.parse(localStorage.getItem('guestPhotos'))
    expect(photos.map(p => ({ id: p.id, catIds: p.catIds }))).toEqual([
      { id: 'p1', catIds: ['clove'] },
      { id: 'p2', catIds: [] },
      { id: 'p3', catIds: ['clove'] },
    ])
  })
})

describe('guest.hideDemoCat / hideDemoPhoto', () => {
  it('hideDemoCat adds id to hidden set, getter reflects it', () => {
    expect(guest.getHiddenDemoCats().has('demo-muffin')).toBe(false)
    guest.hideDemoCat('demo-muffin')
    expect(guest.getHiddenDemoCats().has('demo-muffin')).toBe(true)
  })

  it('hideDemoPhoto adds id to hidden set, getter reflects it', () => {
    expect(guest.getHiddenDemoPhotos().has('demo-photo-0').valueOf()).toBe(false)
    guest.hideDemoPhoto('demo-photo-0')
    expect(guest.getHiddenDemoPhotos().has('demo-photo-0')).toBe(true)
  })

  it('hideDemoCat triggers emit (subscriber is called)', async () => {
    const { guest: g, subscribe } = await import('../utils/guestStorage.js?bust=' + Math.random())
    let calls = 0
    const unsub = subscribe(() => { calls += 1 })
    g.hideDemoCat('demo-x')
    expect(calls).toBeGreaterThan(0)
    unsub()
  })
})

describe('guest.updatePhoto', () => {
  it('updates catIds and note in localStorage', () => {
    localStorage.setItem('guestPhotos', JSON.stringify([
      { id: 'p1', catIds: ['muffin'], note: 'old' },
    ]))
    guest.updatePhoto('p1', { catIds: ['muffin', 'clove'], note: 'new' })
    const photos = JSON.parse(localStorage.getItem('guestPhotos'))
    expect(photos).toEqual([
      { id: 'p1', catIds: ['muffin', 'clove'], note: 'new' },
    ])
  })

  it('preserves other fields when patching subset', () => {
    localStorage.setItem('guestPhotos', JSON.stringify([
      { id: 'p1', catIds: ['muffin'], note: 'old', width: 800, height: 600 },
    ]))
    guest.updatePhoto('p1', { catIds: [], note: '' })
    const photos = JSON.parse(localStorage.getItem('guestPhotos'))
    expect(photos[0]).toMatchObject({ id: 'p1', width: 800, height: 600 })
  })

  it('is a no-op for non-existent id', () => {
    localStorage.setItem('guestPhotos', JSON.stringify([
      { id: 'p1', catIds: [], note: '' },
    ]))
    guest.updatePhoto('p99', { catIds: ['muffin'], note: 'x' })
    const photos = JSON.parse(localStorage.getItem('guestPhotos'))
    expect(photos).toEqual([{ id: 'p1', catIds: [], note: '' }])
  })

  it('emits change so subscribers are notified', async () => {
    const { guest: g, subscribe } = await import('../utils/guestStorage.js?bust=' + Math.random())
    localStorage.setItem('guestPhotos', JSON.stringify([
      { id: 'p1', catIds: [], note: '' },
    ]))
    let calls = 0
    const unsub = subscribe(() => { calls += 1 })
    g.updatePhoto('p1', { catIds: ['x'], note: 'y' })
    expect(calls).toBeGreaterThan(0)
    unsub()
  })
})
