const KEYS = {
  cats: 'guestCats',
  photos: 'guestPhotos',
  scores: 'guestScores',
  stars: 'guestTotalStars',
  stats: 'guestUserStats',
}

const readJson = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k) ?? '') ?? fallback } catch { return fallback }
}
const writeJson = (k, v) => localStorage.setItem(k, JSON.stringify(v))

// Photo File blobs are kept in memory only — they're lost on reload.
const fileMap = new Map()   // photoId -> File
const urlMap = new Map()    // photoId -> objectURL

// Скрытие демо-сущностей в текущей сессии. In-memory only — на reload демо возвращается.
const hiddenDemoCatIds   = new Set()
const hiddenDemoPhotoIds = new Set()

const listeners = new Set()
const cache = {}
const emit = () => { for (const k in cache) delete cache[k]; listeners.forEach(fn => fn()) }
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

export const guest = {
  // ---- cats ----
  getCats() { return (cache.cats ??= readJson(KEYS.cats, [])) },
  addCat(name, slug) {
    const cats = readJson(KEYS.cats, [])
    const cat = { id: slug, name, slug, avatarPhotoId: '', createdAt: Date.now(), isPublic: false }
    cats.push(cat)
    writeJson(KEYS.cats, cats)
    emit()
    return cat
  },
  removeCat(id) {
    // Detach: вычистить slug из catIds во всех фотках одним write'ом
    const photos = readJson(KEYS.photos, [])
    const cleaned = photos.map(p => ({
      ...p,
      catIds: (p.catIds || []).filter(cid => cid !== id),
    }))
    writeJson(KEYS.photos, cleaned)
    // Удалить самого кота
    writeJson(KEYS.cats, readJson(KEYS.cats, []).filter(c => c.id !== id))
    emit()
  },
  hasCatSlug(slug) { return readJson(KEYS.cats, []).some(c => c.slug === slug) },

  // ---- photos ----
  getPhotos() {
    return (cache.photos ??= readJson(KEYS.photos, []).map(p => ({ ...p, imageUrl: urlMap.get(p.id) || '' })))
  },
  addPhoto(meta, file) {
    const id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const url = URL.createObjectURL(file)
    fileMap.set(id, file)
    urlMap.set(id, url)
    const record = { ...meta, id, createdAt: Date.now(), isPublic: false }
    const all = readJson(KEYS.photos, [])
    all.push(record)
    writeJson(KEYS.photos, all)
    emit()
    return { ...record, imageUrl: url }
  },
  removePhoto(id) {
    const url = urlMap.get(id); if (url) URL.revokeObjectURL(url)
    urlMap.delete(id); fileMap.delete(id)
    writeJson(KEYS.photos, readJson(KEYS.photos, []).filter(p => p.id !== id))
    emit()
  },
  updatePhoto(id, patch) {
    const photos = readJson(KEYS.photos, [])
    const idx = photos.findIndex(p => p.id === id)
    if (idx === -1) return
    photos[idx] = { ...photos[idx], ...patch }
    writeJson(KEYS.photos, photos)
    emit()
  },
  photoHasBlob(id) { return fileMap.has(id) },

  // ---- demo session-hidden ----
  hideDemoCat(id)      { hiddenDemoCatIds.add(id);   emit() },
  hideDemoPhoto(id)    { hiddenDemoPhotoIds.add(id); emit() },
  getHiddenDemoCats()   { return hiddenDemoCatIds   },
  getHiddenDemoPhotos() { return hiddenDemoPhotoIds },

  // ---- scores ----
  getScore(photoId, difficulty) {
    const m = readJson(KEYS.scores, {})
    return m[`${photoId}_${difficulty}`] ?? null
  },
  saveScore({ photoId, difficulty, stars, moves, timeSeconds }) {
    const m = readJson(KEYS.scores, {})
    const key = `${photoId}_${difficulty}`
    const prev = m[key]?.stars ?? 0
    const delta = Math.max(0, stars - prev)
    m[key] = { photoId, difficulty, stars, moves, timeSeconds, solvedAt: Date.now() }
    writeJson(KEYS.scores, m)
    const stars0 = Number(localStorage.getItem(KEYS.stars) || '0')
    localStorage.setItem(KEYS.stars, String(stars0 + delta))
    emit()
  },
  getAllScores() { return (cache.scores ??= readJson(KEYS.scores, {})) },
  getTotalStars() { return Number(localStorage.getItem(KEYS.stars) || '0') },
  reset() {
    hiddenDemoCatIds.clear(); hiddenDemoPhotoIds.clear()
    for (const id of urlMap.keys()) URL.revokeObjectURL(urlMap.get(id))
    urlMap.clear(); fileMap.clear()
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
    emit()
  },
}
