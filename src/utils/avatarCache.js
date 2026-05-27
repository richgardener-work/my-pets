const cache = new Map()

export function preloadAvatar(url) {
  if (!url) return Promise.resolve(null)
  if (cache.has(url)) return cache.get(url)
  const p = fetch(url, { referrerPolicy: 'no-referrer' })
    .then(r => (r.ok ? r.blob() : null))
    .then(b => (b ? URL.createObjectURL(b) : null))
    .catch(() => null)
  cache.set(url, p)
  return p
}
