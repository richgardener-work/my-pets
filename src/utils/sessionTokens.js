import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateSessionId() {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export async function createSession({ uid, type, payload, ttlMs = SESSION_TTL_MS }) {
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + ttlMs)

  await setDoc(doc(db, 'sessions', sessionId), {
    uid,
    type,
    payload,
    createdAt: serverTimestamp(),
    expiresAt,
  })

  return sessionId
}

export async function readSession(sessionId, uid) {
  const snap = await getDoc(doc(db, 'sessions', sessionId))

  if (!snap.exists()) throw new Error('not found')

  const data = snap.data()

  if (data.uid !== uid) throw new Error('forbidden')

  const expiresAt = data.expiresAt?.toDate?.() ?? data.expiresAt
  if (expiresAt < new Date()) throw new Error('expired')

  return { type: data.type, payload: data.payload }
}

export async function deleteSession(sessionId) {
  await deleteDoc(doc(db, 'sessions', sessionId))
}
