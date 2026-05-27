import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, getCountFromServer, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const DIFFS = ['3x3', '4x4', '5x5']

export function buildLeaderboard(userDocs) {
  return userDocs
    .filter(u => u.allowed)
    .sort((a, b) => (b.totalStars ?? 0) - (a.totalStars ?? 0))
}

export function useProfile(uid, photoIds = null) {
  const [users, setUsers] = useState([])
  const [photoCounts, setPhotoCounts] = useState({})
  const [puzzleCounts, setPuzzleCounts] = useState({})
  const [usersLoading, setUsersLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const docs = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
      setUsers(buildLeaderboard(docs))
      setUsersLoading(false)
    })
    return unsub
  }, [uid])

  // Fetch photo count for each allowed user; cache results so we don't refetch
  // counts we already have when the leaderboard list updates.
  useEffect(() => {
    if (users.length === 0) return
    let cancelled = false
    const missing = users.filter(u => photoCounts[u.uid] == null)
    if (missing.length === 0) return

    Promise.all(missing.map(async (u) => {
      const q = query(collection(db, 'photos'), where('uploadedBy', '==', u.uid))
      const snap = await getCountFromServer(q).catch(() => null)
      return [u.uid, snap?.data().count ?? 0]
    })).then((entries) => {
      if (cancelled) return
      setPhotoCounts(prev => {
        const next = { ...prev }
        for (const [k, v] of entries) next[k] = v
        return next
      })
    })

    return () => { cancelled = true }
  }, [users, photoCounts])

  useEffect(() => {
    if (users.length === 0) return
    let cancelled = false

    Promise.all(users.map(async (u) => {
      const snap = await getDocs(collection(db, 'users', u.uid, 'games')).catch((err) => {
        console.warn(`leaderboard: cannot read games for ${u.uid}`, err)
        return null
      })
      if (!snap) return [u.uid, 0]
      let count = 0
      snap.docs.forEach(d => {
        if (photoIds != null && !photoIds.has(d.id)) return
        count += DIFFS.filter(diff => d.data()[diff] != null).length
      })
      return [u.uid, count]
    })).then(entries => {
      if (!cancelled) setPuzzleCounts(Object.fromEntries(entries))
    })

    return () => { cancelled = true }
  }, [users, photoIds])

  const leaderboard = users.map(u => ({
    ...u,
    photoCount:    photoCounts[u.uid] ?? 0,
    puzzlesSolved: puzzleCounts[u.uid] ?? 0,
  }))
  const photoCount = photoCounts[uid] ?? 0

  return { leaderboard, photoCount, loading: usersLoading }
}
