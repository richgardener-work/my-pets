import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { loadStorage } from '../firebase-storage'

const VARIANTS = [
  { field: 'microUrl',  size: '200x200' },
  { field: 'smallUrl',  size: '600x600' },
  { field: 'mediumUrl', size: '1600x1600' },
]

export function variantPaths(storagePath) {
  return VARIANTS.map(({ size }) => variantPath(storagePath, size))
}

const POLL_ATTEMPTS = 15
const POLL_DELAY_MS = 2000

function variantPath(storagePath, size) {
  const dot = storagePath.lastIndexOf('.')
  const stem = dot === -1 ? storagePath : storagePath.slice(0, dot)
  return `${stem}_${size}.webp`
}

async function fetchVariantUrl(storagePath, size) {
  const { storage, ref, getDownloadURL } = await loadStorage()
  const path = variantPath(storagePath, size)
  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    try {
      return await getDownloadURL(ref(storage, path))
    } catch (err) {
      if (err?.code !== 'storage/object-not-found') throw err
      await new Promise(r => setTimeout(r, POLL_DELAY_MS))
    }
  }
  return null
}

export async function backfillVariants(photoId, storagePath) {
  const updates = {}
  await Promise.all(VARIANTS.map(async ({ field, size }) => {
    try {
      const url = await fetchVariantUrl(storagePath, size)
      if (url) updates[field] = url
    } catch (err) {
      console.warn(`[variants] ${size} failed for ${photoId}:`, err)
    }
  }))
  if (Object.keys(updates).length > 0) {
    await updateDoc(doc(db, 'photos', photoId), updates)
  }
}
