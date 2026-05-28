import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSession, readSession, deleteSession, SESSION_TTL_MS } from '../utils/sessionTokens'

vi.mock('../firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, col, id) => ({ _col: col, _id: id })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn(),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
}))

beforeEach(() => vi.clearAllMocks())

describe('SESSION_TTL_MS', () => {
  it('equals 24 hours in milliseconds', () => {
    expect(SESSION_TTL_MS).toBe(24 * 60 * 60 * 1000)
  })
})

describe('createSession', () => {
  it('calls setDoc with correct collection and fields', async () => {
    const { setDoc, doc } = await import('firebase/firestore')
    const sessionId = await createSession({
      uid: 'user-1',
      type: 'game',
      payload: { photoId: 'photo-abc', difficulty: '3x3' },
    })
    expect(typeof sessionId).toBe('string')
    expect(sessionId.length).toBeGreaterThanOrEqual(8)
    expect(doc).toHaveBeenCalledWith({}, 'sessions', expect.any(String))
    expect(setDoc).toHaveBeenCalledTimes(1)
    const [, data] = setDoc.mock.calls[0]
    expect(data.uid).toBe('user-1')
    expect(data.type).toBe('game')
    expect(data.payload).toEqual({ photoId: 'photo-abc', difficulty: '3x3' })
    expect(data.expiresAt).toBeInstanceOf(Date)
  })

  it('sets expiresAt approximately 24h from now', async () => {
    const { setDoc } = await import('firebase/firestore')
    const before = Date.now()
    await createSession({ uid: 'u', type: 'game', payload: {} })
    const after = Date.now()
    const [, data] = setDoc.mock.calls[0]
    expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(before + SESSION_TTL_MS - 100)
    expect(data.expiresAt.getTime()).toBeLessThanOrEqual(after + SESSION_TTL_MS + 100)
  })

  it('respects custom ttlMs', async () => {
    const { setDoc } = await import('firebase/firestore')
    const before = Date.now()
    const customTtl = 60 * 1000
    await createSession({ uid: 'u', type: 'game', payload: {}, ttlMs: customTtl })
    const after = Date.now()
    const [, data] = setDoc.mock.calls[0]
    expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(before + customTtl - 100)
    expect(data.expiresAt.getTime()).toBeLessThanOrEqual(after + customTtl + 100)
  })
})

describe('readSession', () => {
  it('returns type and payload when uid matches and session is not expired', async () => {
    const { getDoc } = await import('firebase/firestore')
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'user-1',
        type: 'game',
        payload: { photoId: 'photo-abc', difficulty: '3x3' },
        expiresAt: { toDate: () => new Date(Date.now() + 60_000) },
      }),
    })
    const result = await readSession('session-x', 'user-1')
    expect(result).toEqual({ type: 'game', payload: { photoId: 'photo-abc', difficulty: '3x3' } })
  })

  it('throws "not found" when document does not exist', async () => {
    const { getDoc } = await import('firebase/firestore')
    getDoc.mockResolvedValue({ exists: () => false })
    await expect(readSession('session-x', 'user-1')).rejects.toThrow('not found')
  })

  it('throws "forbidden" when uid does not match', async () => {
    const { getDoc } = await import('firebase/firestore')
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'other-user',
        type: 'game',
        payload: {},
        expiresAt: { toDate: () => new Date(Date.now() + 60_000) },
      }),
    })
    await expect(readSession('session-x', 'user-1')).rejects.toThrow('forbidden')
  })

  it('throws "expired" when expiresAt is in the past', async () => {
    const { getDoc } = await import('firebase/firestore')
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'user-1',
        type: 'game',
        payload: {},
        expiresAt: { toDate: () => new Date(Date.now() - 1000) },
      }),
    })
    await expect(readSession('session-x', 'user-1')).rejects.toThrow('expired')
  })
})

describe('deleteSession', () => {
  it('calls deleteDoc with correct ref', async () => {
    const { deleteDoc, doc } = await import('firebase/firestore')
    await deleteSession('session-x')
    expect(doc).toHaveBeenCalledWith({}, 'sessions', 'session-x')
    expect(deleteDoc).toHaveBeenCalledTimes(1)
  })
})
