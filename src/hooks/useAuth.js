import { useSyncExternalStore } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

let _state = {
  user: null,
  userDoc: null,
  isAuthorized: false,
  loading: true,
  signInPending: false,
}
const _listeners = new Set()
const _subscribe = (fn) => { _listeners.add(fn); return () => _listeners.delete(fn) }
const _emit = () => { for (const fn of _listeners) fn() }
const _setState = (patch) => { _state = { ..._state, ...patch }; _emit() }
const _getSnapshot = () => _state

let _initialized = false
// Firebase deletes its own localStorage token on background network failures
// (iOS Safari PWA) and fires onAuthStateChanged(null) — even if it briefly had
// the user. navigator.onLine is also unreliable on iOS PWA cold-start.
// Guard: only accept Firebase null as a real sign-out if the user explicitly
// triggered it (_userInitiatedSignOut). Any other null while we have a cached
// session in 'mypets:offline_user' is treated as a phantom and ignored.
let _userInitiatedSignOut = false

const OFFLINE_USER_KEY = 'mypets:offline_user'
const _saveOfflineUser = (u) => {
  try {
    localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(
      { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL }
    ))
  } catch {}
}
const _clearOfflineUser = () => { try { localStorage.removeItem(OFFLINE_USER_KEY) } catch {} }
const _loadOfflineUser = () => {
  try { const s = localStorage.getItem(OFFLINE_USER_KEY); return s ? JSON.parse(s) : null } catch { return null }
}

function _init() {
  if (_initialized) return
  _initialized = true

  // Pre-hydrate unconditionally — don't rely on navigator.onLine (unreliable on iOS PWA)
  const cached = _loadOfflineUser()
  if (cached) {
    const docStr = localStorage.getItem(`userDoc:${cached.uid}`)
    const userDoc = docStr ? JSON.parse(docStr) : null
    _setState({ user: cached, userDoc, isAuthorized: !!userDoc?.allowed, loading: false })
  }

  let unsubDoc = null
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      const hasKey = !!localStorage.getItem(OFFLINE_USER_KEY)
      // Ignore phantom null (network-forced sign-out) if user didn't explicitly sign out
      // and we still have a cached session. signOutUser() clears the key first, so
      // localStorage.getItem(OFFLINE_USER_KEY) will be null for real sign-outs.
      if (!_userInitiatedSignOut && hasKey) {
        return
      }
      _userInitiatedSignOut = false
      if (unsubDoc) { unsubDoc(); unsubDoc = null }
      _setState({ user: null, userDoc: null, isAuthorized: false, loading: false })
      return
    }

    if (unsubDoc) { unsubDoc(); unsubDoc = null }
    _saveOfflineUser(firebaseUser)
    _setState({ user: firebaseUser })

    try {
      const cached = localStorage.getItem(`userDoc:${firebaseUser.uid}`)
      if (cached) {
        const data = JSON.parse(cached)
        _setState({ userDoc: data, isAuthorized: !!data?.allowed, loading: false })
      }
    } catch {}

    // After a logout→login user switch the Firestore SDK can briefly still
    // hold the previous user's (or a null) auth token. Awaiting getIdToken()
    // forces this user's token to materialize before we issue the first-login
    // invite read + full userDoc setDoc, so they don't race the token swap and
    // silently fail with permission-denied (leaving a half-written userDoc and
    // an unconsumed invite). Offline: rejects → caught → cached path proceeds.
    await firebaseUser.getIdToken().catch(() => {})

    const userRef = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(userRef).catch((err) => {
      if (err?.code !== 'permission-denied') console.error('userDoc getDoc:', err)
      return null
    })

    if (!snap || !snap.exists()) {
      await setDoc(userRef, {
        email:         firebaseUser.email,
        displayName:   firebaseUser.displayName ?? null,
        photoURL:      firebaseUser.photoURL ?? null,
        allowed:       true,
        admin:         false,
        totalStars:    0,
        totalGames:    0,
        puzzlesSolved: 0,
      }).catch((err) => {
        if (err?.code !== 'permission-denied') console.error('userDoc setDoc:', err)
      })
    }

    // Live-subscribe to userDoc for reactive admin/totalStars updates
    unsubDoc = onSnapshot(
      userRef,
      (s) => {
        const data = s.exists() ? s.data() : null
        _setState({
          userDoc: data,
          // Don't downgrade isAuthorized if allowed is missing (stale iOS HTTP cache
          // sometimes returns documents without all fields).
          isAuthorized: data?.allowed !== undefined ? !!data.allowed : _state.isAuthorized,
          loading: false,
        })
        try {
          if (data) localStorage.setItem(`userDoc:${firebaseUser.uid}`, JSON.stringify(data))
        } catch {}
        if (data && data.allowed === false) {
          // Not allowed — sign out so they don't sit in limbo.
          // Use signOutUser() to clear cached keys so the offline guard
          // doesn't block the resulting onAuthStateChanged(null).
          signOutUser()
        }
      },
      (err) => {
        // permission-denied fires when signOut races with the snapshot;
        // safe to ignore — onAuthStateChanged will clean up the listener.
        if (err.code !== 'permission-denied') console.error('userDoc snapshot:', err)
        _setState({ loading: false })
      },
    )

    // Backfill / refresh displayName + photoURL on every login, so leaderboard
    // shows real names/avatars for other users (not just emails).
    setDoc(
      userRef,
      {
        displayName: firebaseUser.displayName ?? null,
        photoURL:    firebaseUser.photoURL    ?? null,
      },
      { merge: true },
    ).catch((err) => {
      if (err?.code !== 'permission-denied') console.error('userDoc displayName merge:', err)
    })

  })
}

const signInUser = async () => {
  _setState({ signInPending: true })
  let removeVisibility = () => {}
  try {
    // On mobile PWA the auth "popup" opens as a separate browser tab.
    // Firebase never detects that tab being closed, so signInWithPopup hangs forever.
    // We race it against a visibilitychange signal — if the user returns to the app
    // without completing auth, the race resolves and we reset the pending state.
    const returnedToApp = new Promise(resolve => {
      const onVisible = () => { if (document.visibilityState === 'visible') resolve() }
      document.addEventListener('visibilitychange', onVisible)
      removeVisibility = () => document.removeEventListener('visibilitychange', onVisible)
    })
    await Promise.race([
      signInWithPopup(auth, googleProvider).catch(err => {
        if (err?.code !== 'auth/popup-closed-by-user') throw err
      }),
      returnedToApp,
    ])
  } catch (err) {
    console.error('Sign-in failed', err)
  } finally {
    removeVisibility()
    _setState({ signInPending: false })
  }
}
const signOutUser = () => {
  _userInitiatedSignOut = true
  const uid = _state.user?.uid
  _clearOfflineUser()
  try { if (uid) localStorage.removeItem(`userDoc:${uid}`) } catch {}
  return signOut(auth)
}

async function updateNickname(uid, nickname) {
  return updateDoc(doc(db, 'users', uid), { nickname: nickname || null })
}

export function useAuth() {
  _init()
  const state = useSyncExternalStore(_subscribe, _getSnapshot, _getSnapshot)

  return {
    user:          state.user,
    userDoc:       state.userDoc,
    isAuthorized:  state.isAuthorized,
    loading:       state.loading,
    signInPending: state.signInPending,
    signIn:          signInUser,
    signInUser,
    signOutUser,
    updateNickname:  (nickname) => updateNickname(state.user?.uid, nickname),
  }
}
