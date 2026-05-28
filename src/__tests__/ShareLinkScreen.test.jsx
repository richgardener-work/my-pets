import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { getDoc } from 'firebase/firestore'
import ShareLinkScreen from '../pages/ShareLinkScreen'

vi.mock('../firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}))
vi.mock('../features/puzzle/PuzzleBoard', () => ({
  default: () => <div data-testid="puzzle-board" />,
}))
vi.mock('../features/puzzle/VictoryOverlay', () => ({
  default: ({ senderMessage }) => (
    <div data-testid="victory-overlay" data-sender-message={senderMessage ?? ''} />
  ),
}))
vi.mock('../features/puzzle/GameSubHeader', () => ({
  default: () => <div data-testid="game-sub-header" />,
}))
vi.mock('../features/puzzle/puzzleLogic', () => ({
  shuffle: (n) => Array.from({ length: n * n }, (_, i) => i),
  applyMove: vi.fn(),
  isSolved: vi.fn(() => false),
  getStarsForDifficulty: vi.fn(() => 3),
}))

let imgInstances = []
class MockImage {
  constructor() { imgInstances.push(this) }
  set src(_) {}
}

const futureDate = new Date(Date.now() + 10 * 60 * 60 * 1000) // +10h
const pastDate = new Date(Date.now() - 1 * 60 * 60 * 1000)   // -1h

const validShareSnap = {
  exists: () => true,
  data: () => ({
    message: 'Hi, solve this!',
    photoId: 'photo-abc',
    difficulty: '3x3',
    senderUid: null,
    expiresAt: { toDate: () => futureDate },
  }),
}

const expiredShareSnap = {
  exists: () => true,
  data: () => ({
    message: 'Old message',
    photoId: 'photo-abc',
    difficulty: '3x3',
    senderUid: null,
    expiresAt: { toDate: () => pastDate },
  }),
}

const notFoundShareSnap = { exists: () => false }

const mockPhotoSnap = {
  exists: () => true,
  id: 'photo-abc',
  data: () => ({
    imageUrl: 'https://example.com/cat.jpg',
    mediumUrl: 'https://example.com/cat-medium.jpg',
  }),
}

function renderShareLink(shareId = 'abc12345') {
  return render(
    <MemoryRouter initialEntries={[`/share/${shareId}`]}>
      <Routes>
        <Route path="/share/:shareId" element={<ShareLinkScreen />} />
        <Route path="/" element={<div data-testid="home-page" />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  imgInstances = []
  vi.stubGlobal('Image', MockImage)
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
  vi.clearAllMocks()
})

describe('ShareLinkScreen — loading', () => {
  it('shows spinner while loading share doc', () => {
    getDoc.mockReturnValue(new Promise(() => {}))
    renderShareLink()
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })
})

describe('ShareLinkScreen — not found', () => {
  it('shows "Link expired" when share doc does not exist', async () => {
    getDoc.mockResolvedValue(notFoundShareSnap)
    renderShareLink()
    await waitFor(() => {
      expect(screen.getByText(/link expired/i)).toBeInTheDocument()
    })
  })

  it('shows "Back home" link when share doc does not exist', async () => {
    getDoc.mockResolvedValue(notFoundShareSnap)
    renderShareLink()
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back home/i })).toBeInTheDocument()
    })
  })
})

describe('ShareLinkScreen — expired', () => {
  it('shows "Link expired" when expiresAt is in the past', async () => {
    getDoc.mockResolvedValue(expiredShareSnap)
    renderShareLink()
    await waitFor(() => {
      expect(screen.getByText(/link expired/i)).toBeInTheDocument()
    })
  })

  it('shows "Back home" link when expired', async () => {
    getDoc.mockResolvedValue(expiredShareSnap)
    renderShareLink()
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back home/i })).toBeInTheDocument()
    })
  })
})

describe('ShareLinkScreen — happy path', () => {
  it('renders puzzle board when share is valid and image loads', async () => {
    getDoc
      .mockResolvedValueOnce(validShareSnap)
      .mockResolvedValueOnce(mockPhotoSnap)
    renderShareLink()
    await waitFor(() => expect(imgInstances.length).toBeGreaterThan(0))
    await act(async () => { imgInstances[0].onload?.() })
    expect(screen.getByTestId('puzzle-board')).toBeInTheDocument()
  })

  it('passes senderMessage to VictoryOverlay', async () => {
    getDoc
      .mockResolvedValueOnce(validShareSnap)
      .mockResolvedValueOnce(mockPhotoSnap)
    renderShareLink()
    await waitFor(() => expect(imgInstances.length).toBeGreaterThan(0))
    await act(async () => { imgInstances[0].onload?.() })
    const overlay = screen.getByTestId('victory-overlay')
    expect(overlay).toHaveAttribute('data-sender-message', 'Hi, solve this!')
  })
})
