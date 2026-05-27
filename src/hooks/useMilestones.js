import { useEffect, useSyncExternalStore } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import {
  setMilestoneConfigs,
  getActiveMilestones,
  getUnseenCount,
  subscribeMilestones,
  clearMilestoneSession,
} from '../utils/milestones'

export function useMilestones(auth) {
  const { isAuthorized } = auth
  const active = useSyncExternalStore(
    subscribeMilestones,
    getActiveMilestones,
    getActiveMilestones,
  )
  const unseenCount = useSyncExternalStore(
    subscribeMilestones,
    getUnseenCount,
    getUnseenCount,
  )

  useEffect(() => {
    if (!isAuthorized) {
      clearMilestoneSession()
      return
    }
    return onSnapshot(
      collection(db, 'milestones'),
      (snap) => {
        setMilestoneConfigs(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((m) => m.enabled !== false),
        )
      },
      (err) => {
        if (err?.code !== 'permission-denied') console.error('milestones snapshot:', err)
      },
    )
  }, [isAuthorized])

  return { active, unseenCount }
}
