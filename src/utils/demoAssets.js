const homeFiles = import.meta.glob('../assets/demo/home/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })

import homeIndexJson from '../assets/demo/home/index.json'

const basename = (path) => path.split('/').pop()
const stripExt = (name) => name.replace(/\.[^.]+$/, '')

export function buildDemoAssets({ homeFiles, homeIndex }) {
  const homeByName = Object.fromEntries(
    Object.entries(homeFiles).map(([path, url]) => [basename(path), url])
  )

  const indexedHome = homeIndex
    .filter(entry => homeByName[entry.file])
    .map(entry => ({ url: homeByName[entry.file], cat: entry.cat }))
  const indexedHomeFiles = new Set(homeIndex.map(e => e.file))
  const orphanHome = Object.entries(homeByName)
    .filter(([name]) => !indexedHomeFiles.has(name))
    .map(([name, url]) => ({ url, cat: stripExt(name) }))

  return { homeDeckItems: [...indexedHome, ...orphanHome] }
}

const { homeDeckItems } = buildDemoAssets({ homeFiles, homeIndex: homeIndexJson })

export { homeDeckItems }
