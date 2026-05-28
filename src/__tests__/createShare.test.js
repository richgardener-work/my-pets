import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateShareId, createShareDoc, SHARE_TTL_MS } from '../utils/createShare'

vi.mock('../firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, col, id) => ({ _col: col, _id: id })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
}))

beforeEach(() => vi.clearAllMocks())

describe('generateShareId', () => {
  it('returns a string of length 8', () => {
    expect(generateShareId()).toHaveLength(8)
  })

  it('contains only alphanumeric characters', () => {
    const id = generateShareId()
    expect(id).toMatch(/^[a-zA-Z0-9]{8}$/)
  })

  it('returns different values on subsequent calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateShareId()))
    expect(ids.size).toBeGreaterThan(15)
  })
})

describe('SHARE_TTL_MS', () => {
  it('equals 24 hours in milliseconds', () => {
    expect(SHARE_TTL_MS).toBe(24 * 60 * 60 * 1000)
  })
})

describe('createShareDoc', () => {
  it('calls setDoc with correct collection path', async () => {
    const { setDoc, doc } = await import('firebase/firestore')
    await createShareDoc({
      message: 'Hello!',
      photoId: 'photo-abc',
      difficulty: '3x3',
      senderUid: null,
    })
    expect(doc).toHaveBeenCalledWith({}, 'shares', expect.any(String))
    expect(setDoc).toHaveBeenCalledTimes(1)
  })

  it('returns shareId of length 8', async () => {
    const result = await createShareDoc({
      message: 'Hi',
      photoId: 'photo-abc',
      difficulty: '4x4',
      senderUid: 'uid-123',
    })
    expect(result.shareId).toHaveLength(8)
  })

  it('includes message, photoId, difficulty, senderUid in doc data', async () => {
    const { setDoc } = await import('firebase/firestore')
    await createShareDoc({
      message: 'Test msg',
      photoId: 'photo-xyz',
      difficulty: '5x5',
      senderUid: null,
    })
    const [, data] = setDoc.mock.calls[0]
    expect(data.message).toBe('Test msg')
    expect(data.photoId).toBe('photo-xyz')
    expect(data.difficulty).toBe('5x5')
    expect(data.senderUid).toBeNull()
  })

  it('sets expiresAt to a Date approximately 24h from now', async () => {
    const { setDoc } = await import('firebase/firestore')
    const before = Date.now()
    await createShareDoc({
      message: 'Hi',
      photoId: 'p',
      difficulty: '3x3',
      senderUid: null,
    })
    const after = Date.now()
    const [, data] = setDoc.mock.calls[0]
    expect(data.expiresAt).toBeInstanceOf(Date)
    expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(before + SHARE_TTL_MS - 100)
    expect(data.expiresAt.getTime()).toBeLessThanOrEqual(after + SHARE_TTL_MS + 100)
  })

  it('includes serverTimestamp as createdAt', async () => {
    const { setDoc, serverTimestamp } = await import('firebase/firestore')
    await createShareDoc({
      message: 'Hi',
      photoId: 'p',
      difficulty: '3x3',
      senderUid: null,
    })
    const [, data] = setDoc.mock.calls[0]
    expect(data.createdAt).toEqual({ _type: 'serverTimestamp' })
    expect(serverTimestamp).toHaveBeenCalled()
  })
})
