import { useState, useEffect, useSyncExternalStore } from 'react'
import {
  collection, onSnapshot,
  doc, getDoc, writeBatch, serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from '../firebase'
import { guest, subscribe as guestSubscribe } from '../utils/guestStorage'
import { computeScoreUpdate } from '../utils/scoreLogic'
import { registerCrossing } from '../utils/milestones'

const DIFFS = ['3x3', '4x4', '5x5']

export function useGames(auth) {
  const { isAuthorized, user, userDoc } = auth
  const [levels, setLevels] = useState({})
  const [loading, setLoading] = useState(true)

  const guestStars  = useSyncExternalStore(guestSubscribe, () => guest.getTotalStars(), () => 0)
  const guestScores = useSyncExternalStore(guestSubscribe, () => guest.getAllScores(), () => ({}))

  useEffect(() => {
    if (!isAuthorized || !user) { setLevels({}); setLoading(false); return }
    // Each game doc: users/{uid}/games/{photoId} with difficulty keys as map fields
    const gamesRef = collection(db, 'users', user.uid, 'games')
    return onSnapshot(gamesRef, (snap) => {
      const map = {}
      snap.docs.forEach(d => {
        const photoId = d.id
        const data = d.data()
        DIFFS.forEach(diff => {
          if (data[diff]) map[`${photoId}_${diff}`] = data[diff]
        })
      })
      setLevels(map)
      setLoading(false)
    })
  }, [isAuthorized, user])

  const saveScore = async (uid, photoId, difficulty, { moves, timeSeconds }) => {
    if (!isAuthorized) {
      return guest.saveScore({
        photoId, difficulty,
        stars: ({ '3x3': 1, '4x4': 2, '5x5': 3 })[difficulty] ?? 0,
        moves, timeSeconds,
      })
    }

    const gameRef = doc(db, 'users', uid, 'games', photoId)
    const userRef = doc(db, 'users', uid)
    try {
      const gameSnap = await getDoc(gameRef)
      const prevLevel = gameSnap.exists() ? (gameSnap.data()[difficulty] ?? null) : null
      const update = computeScoreUpdate(prevLevel, { moves, timeSeconds, difficulty })

      const batch = writeBatch(db)
      batch.set(gameRef, {
        [difficulty]: {
          bestMoves:       update.bestMoves,
          bestTimeSeconds: update.bestTimeSeconds,
          plays:           (prevLevel?.plays ?? 0) + 1,
          lastPlayedAt:    serverTimestamp(),
        },
      }, { merge: true })

      batch.set(userRef, {
        totalStars: increment(update.starsToAdd),
        totalGames: increment(1),
      }, { merge: true })

      await batch.commit()

      const prevTotal = userDoc?.totalStars ?? 0
      registerCrossing(prevTotal, prevTotal + update.starsToAdd)
    } catch (err) {
      console.error('saveScore failed:', err)
    }
  }

  const getScore = (uid, photoId, difficulty) => {
    if (!isAuthorized) return guestScores[`${photoId}_${difficulty}`] || null
    const lvl = levels[`${photoId}_${difficulty}`]
    if (!lvl) return null
    return {
      stars: ({ '3x3': 1, '4x4': 2, '5x5': 3 })[difficulty] ?? 0,
      moves: lvl.bestMoves,
      timeSeconds: lvl.bestTimeSeconds,
      plays: lvl.plays,
    }
  }

  return {
    scores: isAuthorized ? levels : guestScores,
    loading,
    saveScore,
    getScore,
    totalStars: isAuthorized ? (userDoc?.totalStars ?? 0) : guestStars,
  }
}
