import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export const SHARE_TTL_MS = 24 * 60 * 60 * 1000

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function generateShareId() {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

/**
 * Creates a share document in Firestore.
 * @param {{ message: string, photoId: string, difficulty: string, senderUid: string|null }} params
 * @returns {Promise<{ shareId: string, url: string }>}
 */
export async function createShareDoc({ message, photoId, difficulty, senderUid, ttlMs = SHARE_TTL_MS }) {
  const shareId = generateShareId()
  const expiresAt = ttlMs === null ? null : new Date(Date.now() + ttlMs)

  await setDoc(doc(db, 'shares', shareId), {
    message,
    photoId,
    difficulty,
    senderUid,
    createdAt: serverTimestamp(),
    expiresAt,
  })

  const url = `${window.location.origin}/my-pets/share/${shareId}`
  return { shareId, url }
}
