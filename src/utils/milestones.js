// Session-only milestone gift system.
//
// A milestone "crosses" when totalStars moves strictly above its threshold
// up to (and including) the new total — detected at the moment a game is won.
// Active milestones live in memory for the current session only: a page
// reload / app restart starts with an empty list and nothing reappears.

export function crossedMilestones(configs, prevTotal, newTotal) {
  return configs.filter(
    (m) => m.enabled !== false && prevTotal < m.stars && m.stars <= newTotal,
  )
}

let _configs = []
let _active = []
let _seen = new Set()
let _annotated = []
const _listeners = new Set()
const _rebuild = () => { _annotated = _active.map((m) => ({ ...m, seen: _seen.has(m.id) })) }
const _emit = () => { _rebuild(); for (const fn of _listeners) fn() }

export function setMilestoneConfigs(list) {
  _configs = Array.isArray(list) ? list : []
}

export function registerCrossing(prevTotal, newTotal) {
  const fresh = crossedMilestones(_configs, prevTotal, newTotal)
    .filter((m) => !_active.some((a) => a.id === m.id))
  if (fresh.length === 0) return
  _active = [..._active, ...fresh]
  _emit()
}

export function getActiveMilestones() {
  return _annotated
}

export function subscribeMilestones(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

export function markMilestoneSeen(id) {
  if (_seen.has(id)) return
  _seen.add(id)
  _emit()
}

export function getUnseenCount() {
  return _active.filter((m) => !_seen.has(m.id)).length
}

export function clearMilestoneSession() {
  _configs = []
  _active = []
  _seen = new Set()
  _annotated = []
  for (const fn of _listeners) fn()
}
