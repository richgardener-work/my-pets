import { useEffect, useState, useCallback, useSyncExternalStore, useMemo } from 'react'
import {
  collection, query, where, onSnapshot,
  doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch, arrayRemove, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './useAuth'
import { findAvailableSlug } from '../utils/slugify'
import { guest, subscribe as guestSubscribe } from '../utils/guestStorage'

export function usePets() {
  const { user, isAuthorized } = useAuth()

  const guestPetsRaw = useSyncExternalStore(guestSubscribe, () => guest.getCats(), () => [])

  const [dbPets, setDbPets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthorized || !user) { setDbPets([]); setLoading(false); return }
    const q = collection(db, 'users', user.uid, 'pets')
    const unsub = onSnapshot(q, (snap) => {
      setDbPets(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [isAuthorized, user])

  const guestMerged = useMemo(() => guestPetsRaw, [guestPetsRaw])

  const addPet = useCallback(async (name) => {
    const trimmed = (name ?? '').trim()
    if (!trimmed) throw new Error('Pet name is required')
    const knownPets = isAuthorized ? dbPets : guestMerged
    const existing = knownPets.find(c => c.name.trim().toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing.id
    if (!isAuthorized) {
      const slug = await findAvailableSlug(trimmed, async (s) => guest.hasCatSlug(s))
      return guest.addCat(trimmed, slug).id
    }
    if (!user) throw new Error('Must be signed in')
    const slug = await findAvailableSlug(trimmed, async (s) => {
      const snap = await getDoc(doc(db, 'users', user.uid, 'pets', s))
      return snap.exists()
    })
    await setDoc(doc(db, 'users', user.uid, 'pets', slug), {
      name: trimmed,
      slug,
      avatarPhotoId: '',
      createdAt: serverTimestamp(),
    })
    return slug
  }, [isAuthorized, user, dbPets, guestMerged])

  const removePet = useCallback(async (id) => {
    if (!isAuthorized) {
      return guest.removeCat(id)
    }
    if (!user) throw new Error('Must be signed in')
    // Каскадный detach — вычистить slug из catIds только фоток текущего пользователя
    const photosSnap = await getDocs(query(
      collection(db, 'photos'),
      where('catIds', 'array-contains', id),
      where('uploadedBy', '==', user.uid)
    ))
    if (photosSnap.size > 0) {
      const batch = writeBatch(db)
      for (const p of photosSnap.docs) {
        batch.update(p.ref, { catIds: arrayRemove(id) })
      }
      await batch.commit()
    }
    await deleteDoc(doc(db, 'users', user.uid, 'pets', id))
  }, [isAuthorized, user, guestPetsRaw])

  return {
    pets: isAuthorized ? dbPets : guestMerged,
    addPet,
    removePet,
    loading: isAuthorized ? loading : false,
  }
}
