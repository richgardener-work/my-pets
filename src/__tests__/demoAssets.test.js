// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildDemoAssets } from '../utils/demoAssets.js'

const homeFiles = {
  './demo/home/muffin.png': '/static/muffin.hash.png',
  './demo/home/clove.png':  '/static/clove.hash.png',
  './demo/home/orphan.png': '/static/orphan.hash.png',
}
const homeIndex = [
  { file: 'muffin.png', cat: 'Muffin' },
  { file: 'clove.png',  cat: 'Clove' },
  { file: 'missing.png', cat: 'Ghost' },
]

describe('buildDemoAssets', () => {
  it('homeDeckItems: возвращает запись для каждого файла с урлом и подписью', () => {
    const { homeDeckItems } = buildDemoAssets({ homeFiles, homeIndex })
    expect(homeDeckItems).toEqual([
      { url: '/static/muffin.hash.png', cat: 'Muffin' },
      { url: '/static/clove.hash.png',  cat: 'Clove' },
      { url: '/static/orphan.hash.png', cat: 'orphan' },
    ])
  })

  it('homeDeckItems: запись с отсутствующим файлом игнорируется', () => {
    const { homeDeckItems } = buildDemoAssets({ homeFiles, homeIndex })
    expect(homeDeckItems.find(i => i.cat === 'Ghost')).toBeUndefined()
  })
})
