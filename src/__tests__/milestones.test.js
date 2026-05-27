import { describe, it, expect, beforeEach } from 'vitest'
import {
  crossedMilestones,
  setMilestoneConfigs,
  registerCrossing,
  getActiveMilestones,
  getUnseenCount,
  markMilestoneSeen,
  subscribeMilestones,
  clearMilestoneSession,
} from '../utils/milestones'

const M = (id, stars, enabled = true) => ({ id, stars, enabled, text: `t-${id}` })

describe('crossedMilestones (pure)', () => {
  it('returns a milestone whose threshold is strictly above prev and at/below new', () => {
    const r = crossedMilestones([M('a', 1)], 0, 1)
    expect(r.map(m => m.id)).toEqual(['a'])
  })

  it('excludes a milestone already passed before this session (stars <= prevTotal)', () => {
    const r = crossedMilestones([M('a', 1)], 20, 21)
    expect(r).toEqual([])
  })

  it('excludes a milestone not yet reached (stars > newTotal)', () => {
    const r = crossedMilestones([M('a', 10)], 0, 3)
    expect(r).toEqual([])
  })

  it('boundary: stars === newTotal is crossed, stars === prevTotal is not', () => {
    expect(crossedMilestones([M('hit', 5)], 4, 5).map(m => m.id)).toEqual(['hit'])
    expect(crossedMilestones([M('eq', 5)], 5, 6)).toEqual([])
  })

  it('returns multiple milestones crossed in one jump', () => {
    const cfgs = [M('a', 1), M('b', 2), M('c', 10)]
    expect(crossedMilestones(cfgs, 0, 3).map(m => m.id).sort()).toEqual(['a', 'b'])
  })

  it('ignores disabled milestones even when threshold is crossed', () => {
    expect(crossedMilestones([M('off', 1, false)], 0, 1)).toEqual([])
  })

  it('no crossing when total did not move (replay with prev === new)', () => {
    expect(crossedMilestones([M('a', 1)], 1, 1)).toEqual([])
  })
})

describe('milestone session store', () => {
  beforeEach(() => clearMilestoneSession())

  it('registerCrossing accumulates active milestones from stored configs', () => {
    setMilestoneConfigs([M('a', 1), M('b', 5)])
    registerCrossing(0, 1)
    expect(getActiveMilestones().map(m => m.id)).toEqual(['a'])
  })

  it('does not duplicate a milestone already active', () => {
    setMilestoneConfigs([M('a', 1)])
    registerCrossing(0, 1)
    registerCrossing(0, 1)
    expect(getActiveMilestones().map(m => m.id)).toEqual(['a'])
  })

  it('notifies subscribers when a new milestone becomes active', () => {
    setMilestoneConfigs([M('a', 1)])
    let calls = 0
    const unsub = subscribeMilestones(() => { calls++ })
    registerCrossing(0, 1)
    expect(calls).toBe(1)
    unsub()
    registerCrossing(0, 1) // already active → no emit, and unsubscribed anyway
    expect(calls).toBe(1)
  })

  it('markMilestoneSeen reduces unseenCount but keeps active list intact', () => {
    setMilestoneConfigs([M('a', 1), M('b', 5)])
    registerCrossing(0, 5)
    expect(getUnseenCount()).toBe(2)
    let calls = 0
    const unsub = subscribeMilestones(() => { calls++ })
    markMilestoneSeen('a')
    expect(getActiveMilestones().map(m => m.id).sort()).toEqual(['a', 'b'])
    expect(getUnseenCount()).toBe(1)
    expect(calls).toBe(1)
    unsub()
  })

  it('markMilestoneSeen is a no-op if already seen', () => {
    setMilestoneConfigs([M('a', 1)])
    registerCrossing(0, 1)
    markMilestoneSeen('a')
    let calls = 0
    const unsub = subscribeMilestones(() => { calls++ })
    markMilestoneSeen('a')
    expect(calls).toBe(0)
    unsub()
  })

  it('clearMilestoneSession empties active list (sign-out / fresh load)', () => {
    setMilestoneConfigs([M('a', 1)])
    registerCrossing(0, 1)
    expect(getActiveMilestones()).toHaveLength(1)
    clearMilestoneSession()
    expect(getActiveMilestones()).toEqual([])
  })
})
