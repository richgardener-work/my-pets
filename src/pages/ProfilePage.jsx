import { useState, useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { LogOut, Star, Image as ImageIcon, Puzzle, Gamepad2, Pencil } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { usePhotos } from '../hooks/usePhotos'
import CountUp from '../components/CountUp'
import { preloadAvatar } from '../utils/avatarCache'

const MAX_NAME = 16

function firstNameOf(user, userDoc) {
  if (userDoc?.nickname?.trim()) return userDoc.nickname.trim()
  const display = user?.displayName?.trim()
  if (display) return display.split(/\s+/)[0]
  const email = user?.email
  if (email) return email.split('@')[0]
  return 'friend'
}

function truncateName(name) {
  return name.length > MAX_NAME ? name.slice(0, MAX_NAME) + '…' : name
}

function NicknameEdit({ currentNickname, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(currentNickname ?? '')

  function save() {
    onSave(draft.trim() || null)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex h-7 w-full items-center overflow-hidden rounded-full border border-dashed border-[#E879B4] px-3">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={save}
          placeholder="+ name"
          className="min-w-0 flex-1 bg-transparent outline-none"
          style={{ fontSize: '16px', transform: 'scale(0.75)', transformOrigin: 'left center' }}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex h-7 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-[#E879B4] px-3 text-[11px] text-[#E879B4] transition hover:bg-[#E879B4]/10"
    >
      <Pencil size={11} className="flex-shrink-0" />
      <span>Name</span>
    </button>
  )
}

const DIFFS = ['3x3', '4x4', '5x5']

export default function ProfilePage({ auth, games }) {
  const { user, userDoc, isAuthorized, signOutUser, updateNickname } = auth
  const { photos: allPhotos } = usePhotos(null, null)
  const photoIdSet = useMemo(() => new Set(allPhotos.map(p => p.id)), [allPhotos])
  const { photoCount, leaderboard, loading } = useProfile(user?.uid, photoIdSet)
  const { getScore } = games

  const photoUrlsKey = [user?.photoURL, ...leaderboard.map(u => u.photoURL)]
    .filter(Boolean).join('|')

  const [avatarUrls, setAvatarUrls] = useState({})
  useEffect(() => {
    photoUrlsKey.split('|').filter(Boolean).forEach(url => {
      preloadAvatar(url).then(blobUrl => {
        if (blobUrl) setAvatarUrls(prev => {
          if (prev[url] === blobUrl) return prev
          return { ...prev, [url]: blobUrl }
        })
      })
    })
  }, [photoUrlsKey])

  if (!isAuthorized) return <Navigate to="/" replace />

  const uid = user?.uid ?? ''
  const firstName = truncateName(firstNameOf(user, userDoc))
  const totalStars = userDoc?.totalStars ?? 0
  const puzzlesSolved = allPhotos.reduce(
    (acc, p) => acc + DIFFS.filter(d => (getScore(uid, p.id, d)?.stars ?? 0) > 0).length,
    0
  )
  const totalGames = userDoc?.totalGames ?? 0
  const totalPossible = allPhotos.length * 3
  const initial = (user?.displayName || user?.email || '?').charAt(0).toUpperCase()

  return (
    <div className="w-full mx-auto max-w-6xl px-6 pt-8 pb-0 sm:pt-14">
      {/* Hero — 2×2 grid: left 70% / right 30%, top text / bottom account */}
      <header className="grid grid-cols-[7fr_3fr] gap-x-6 gap-y-6">
        {/* Top-left: eyebrow + H1 + subtitle */}
        <div className="flex min-w-0 flex-col">
          <div className="text-xs uppercase tracking-[0.2em] opacity-60">Just you</div>
          <h1 className="mt-2 font-display font-wonky text-5xl">
            Hello, <span className="font-hand-accent text-[0.85em] text-[#E879B4]">{firstName}</span>
          </h1>
          <div className="flex flex-1 items-center">
            <p className="flex items-center gap-1.5 text-sm opacity-70">
              A place where the
              <span className="inline-flex items-center gap-1 font-hand-accent text-[#E879B4] not-italic opacity-100">
                <CountUp value={totalStars} />
                <Star size={13} fill="currentColor" strokeWidth={0} />
              </span>
              live
            </p>
          </div>
        </div>

        {/* Top-right: name edit + stats */}
        <div className="flex min-w-0 flex-col justify-end gap-2">
          <NicknameEdit currentNickname={userDoc?.nickname} onSave={updateNickname} />
          <div className="overflow-hidden rounded-2xl border border-black/8 bg-white/80 text-xs dark:border-white/10 dark:bg-dark-card/80">
            <div className="flex items-center gap-1.5 px-3 py-1.5">
              <ImageIcon size={12} className="flex-shrink-0 opacity-50" />
              <span className="font-semibold tabular-nums">{photoCount}</span>
              <span className="ml-auto hidden whitespace-nowrap opacity-60 sm:inline">You Upload</span>
            </div>
            <div className="flex items-center gap-1.5 border-t border-black/5 px-3 py-1.5 dark:border-white/8">
              <Puzzle size={12} className="flex-shrink-0 opacity-50" />
              <span className="font-semibold tabular-nums">{puzzlesSolved}</span>
              {totalPossible > 0 && <span className="opacity-40">/ {totalPossible}</span>}
              <span className="ml-auto hidden whitespace-nowrap opacity-60 sm:inline">Puzzles Solved</span>
            </div>
            <div className="flex items-center gap-1.5 border-t border-black/5 px-3 py-1.5 dark:border-white/8">
              <Gamepad2 size={12} className="flex-shrink-0 opacity-50" />
              <span className="font-semibold tabular-nums">{totalGames}</span>
              <span className="ml-auto hidden whitespace-nowrap opacity-60 sm:inline">Total Games</span>
            </div>
          </div>
        </div>

        {/* Bottom-left: Google account — avatar + full name + email */}
        <div className="flex items-center gap-3 border-t border-black/6 pt-4 dark:border-white/8">
          <span className="relative h-11 w-11 flex-shrink-0">
            <div className="bg-morph grid h-11 w-11 place-items-center rounded-full text-lg font-bold text-white shadow-sm">
              {initial}
            </div>
            {avatarUrls[user?.photoURL] && (
              <img
                src={avatarUrls[user.photoURL]}
                alt=""
                className="absolute inset-0 h-11 w-11 rounded-full object-cover shadow-sm"
              />
            )}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user?.displayName}</div>
            <div className="truncate text-xs opacity-40">{user?.email}</div>
          </div>
        </div>

        {/* Bottom-right: sign out — aligned with account row */}
        <div className="flex items-center justify-end border-t border-black/6 pt-4 dark:border-white/8">
          <button
            type="button"
            onClick={signOutUser}
            aria-label="Sign out"
            className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 px-3 py-1 text-[13px] text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Leaderboard */}
      <section className="mt-12">
        <div className="text-xs uppercase tracking-[0.2em] opacity-60 mb-4">Leaderboard</div>
        {loading ? (
          <div className="py-10 text-center text-sm opacity-40">Loading…</div>
        ) : (
          <div className="rounded-2xl border border-black/8 dark:border-white/10 max-h-[420px] overflow-y-auto">
            {leaderboard.map((u, i) => {
              const isMe = u.uid === user?.uid
              const rank = i + 1
              const uInitial = (u.displayName || u.email || '?').charAt(0).toUpperCase()
              return (
                <div
                  key={u.uid}
                  className={`flex items-center gap-3 px-4 py-2.5 ${
                    i > 0 ? 'border-t border-black/5 dark:border-white/8' : ''
                  } ${
                    isMe ? 'bg-[#E879B4]/10' : 'bg-white/80 dark:bg-dark-card/80'
                  }`}
                >
                  <span className={`font-hand w-5 flex-shrink-0 text-center text-sm ${isMe ? 'text-[#E879B4]' : 'opacity-30'}`}>
                    {rank}
                  </span>
                  <span className="relative h-8 w-8 flex-shrink-0">
                    <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                      isMe ? 'bg-morph text-white' : 'bg-black/10 dark:bg-white/10'
                    }`}>
                      {uInitial}
                    </div>
                    {avatarUrls[u.photoURL] && (
                      <img
                        src={avatarUrls[u.photoURL]}
                        alt=""
                        className="absolute inset-0 h-8 w-8 rounded-full object-cover"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 truncate text-sm font-medium">
                    {u.nickname ?? u.displayName ?? u.email}
                    {isMe && <span className="ml-1 text-xs font-normal opacity-40">· you</span>}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span className="font-hand inline-flex items-center gap-1 text-base text-[#E879B4]">
                      <Star size={13} fill="currentColor" strokeWidth={0} />
                      <span className="inline-block w-9 text-left tabular-nums">{u.totalStars ?? 0}</span>
                    </span>
                    <span className="hidden items-center gap-1 text-xs opacity-50 sm:inline-flex">
                      <ImageIcon size={11} />
                      <span className="inline-block w-7 text-left tabular-nums">{u.photoCount ?? 0}</span>
                    </span>
                    <span className="hidden items-center gap-1 text-xs opacity-50 sm:inline-flex">
                      <Puzzle size={11} />
                      <span className="inline-block w-7 text-left tabular-nums">{u.puzzlesSolved ?? 0}</span>
                    </span>
                    <span className="hidden items-center gap-1 text-xs opacity-50 sm:inline-flex">
                      <Gamepad2 size={11} />
                      <span className="inline-block w-7 text-left tabular-nums">{u.totalGames ?? 0}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
