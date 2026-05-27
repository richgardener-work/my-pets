const BASE = import.meta.env.BASE_URL

export function pickRandom(arr) {
  if (!arr || !arr.length) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

// Videos in src/assets/demo/hero/ — Vite resolves URLs at build time.
// In dev mode, large files may not load via the module pipeline;
// fall back to public/ copies for desktop.
const _desktopGlob = Object.values(
  import.meta.glob('../assets/demo/hero/desktop/*.mp4', { eager: true, query: '?url', import: 'default' })
).filter(Boolean)

export const desktopVideos = _desktopGlob.length > 0
  ? _desktopGlob
  : [`${BASE}cat-hero.mp4`]

export const mobileVideos = Object.values(
  import.meta.glob('../assets/demo/hero/mobile/*.mp4', { eager: true, query: '?url', import: 'default' })
).filter(Boolean)
