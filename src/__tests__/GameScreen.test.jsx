import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { getDoc } from 'firebase/firestore'
import { readSession, deleteSession } from '../utils/sessionTokens'
import { useAuth } from '../hooks/useAuth'
import GameScreen from '../pages/GameScreen'

// ── deps ───────────────────────────────────────────────────────────────────
vi.mock('../firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}))
vi.mock('../utils/guestStorage', () => ({
  guest: { getPhotos: vi.fn(() => []) },
}))
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: { uid: 'user-1' }, userDoc: null, isAuthorized: true })),
}))
vi.mock('../hooks/usePets', () => ({
  usePets: () => ({ pets: [] }),
}))
vi.mock('../utils/sessionTokens', () => ({
  readSession: vi.fn(),
  deleteSession: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../features/puzzle/PuzzleBoard', () => ({
  default: () => <div data-testid="puzzle-board" />,
}))
vi.mock('../features/puzzle/VictoryOverlay', () => ({
  default: () => null,
}))
vi.mock('../features/puzzle/GameSubHeader', () => ({
  default: () => null,
}))
vi.mock('../components/SharePuzzleModal', () => ({
  default: () => null,
}))
vi.mock('../features/puzzle/puzzleLogic', () => ({
  shuffle: (n) => Array.from({ length: n * n }, (_, i) => i),
  applyMove: vi.fn(),
  isSolved: vi.fn(() => false),
  getStarsForDifficulty: vi.fn(() => 3),
  autoSolveMoves: vi.fn(() => []),
}))

// ── Image mock ─────────────────────────────────────────────────────────────
let imgInstances = []
class MockImage {
  constructor() { imgInstances.push(this) }
  set src(_) { /* manual control in tests */ }
}

// ── shared helpers ─────────────────────────────────────────────────────────
const mockPhotoSnap = {
  exists: () => true,
  id: 'photo-123',
  data: () => ({
    imageUrl: 'https://example.com/photo.jpg',
    mediumUrl: 'https://example.com/photo-medium.jpg',
    catIds: [],
    aspectRatio: 1,
  }),
}

const mockAuth = { user: { uid: 'user-1' }, userDoc: null, isAuthorized: true }
const mockGames = { saveScore: vi.fn(), getScore: vi.fn(() => null) }

function renderGame() {
  return render(
    <MemoryRouter initialEntries={['/games/session-abc']}>
      <Routes>
        <Route
          path="/games/:sessionId"
          element={<GameScreen auth={mockAuth} games={mockGames} />}
        />
        <Route path="/games" element={<div data-testid="games-page" />} />
        <Route path="/" element={<div data-testid="home-page" />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  imgInstances = []
  vi.stubGlobal('Image', MockImage)
  vi.clearAllMocks()
  useAuth.mockReturnValue({ user: { uid: 'user-1' }, userDoc: null, isAuthorized: true })
})

// ── tests ──────────────────────────────────────────────────────────────────
describe('GameScreen — image guard', () => {
  it('shows spinner while session and photo are loading', () => {
    readSession.mockReturnValue(new Promise(() => {}))
    renderGame()
    expect(document.querySelector('.animate-spin')).toBeTruthy()
    expect(screen.queryByTestId('puzzle-board')).toBeNull()
  })

  it('shows puzzle board when session resolves and image loads successfully', async () => {
    readSession.mockResolvedValue({ type: 'game', payload: { photoId: 'photo-123', difficulty: '3x3' } })
    getDoc.mockResolvedValue(mockPhotoSnap)
    renderGame()

    await waitFor(() => expect(imgInstances.length).toBeGreaterThan(0))
    await act(async () => { imgInstances[0].onload?.() })

    expect(screen.getByTestId('puzzle-board')).toBeInTheDocument()
    expect(screen.queryByText('Could not load image')).toBeNull()
  })

  it('shows error screen when image fails to load', async () => {
    readSession.mockResolvedValue({ type: 'game', payload: { photoId: 'photo-123', difficulty: '3x3' } })
    getDoc.mockResolvedValue(mockPhotoSnap)
    renderGame()

    await waitFor(() => expect(imgInstances.length).toBeGreaterThan(0))
    await act(async () => { imgInstances[0].onerror?.() })

    expect(screen.getByText('Could not load image')).toBeInTheDocument()
    expect(screen.queryByTestId('puzzle-board')).toBeNull()
  })

  it('Back button on error screen navigates to /games', async () => {
    readSession.mockResolvedValue({ type: 'game', payload: { photoId: 'photo-123', difficulty: '3x3' } })
    getDoc.mockResolvedValue(mockPhotoSnap)
    renderGame()

    await waitFor(() => expect(imgInstances.length).toBeGreaterThan(0))
    await act(async () => { imgInstances[0].onerror?.() })

    const backBtn = screen.getByRole('button', { name: /back/i })
    backBtn.click()

    await waitFor(() => {
      expect(screen.getByTestId('games-page')).toBeInTheDocument()
    })
  })
})

describe('GameScreen — auth guard', () => {
  it('redirects to / when user is not authorized', async () => {
    useAuth.mockReturnValue({ user: null, userDoc: null, isAuthorized: false })
    renderGame()

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
  })
})

describe('GameScreen — session guard', () => {
  it('redirects to /games when session uid does not match', async () => {
    readSession.mockRejectedValue(new Error('forbidden'))
    renderGame()

    await waitFor(() => {
      expect(screen.getByTestId('games-page')).toBeInTheDocument()
    })
  })

  it('redirects to /games when session is not found', async () => {
    readSession.mockRejectedValue(new Error('not found'))
    renderGame()

    await waitFor(() => {
      expect(screen.getByTestId('games-page')).toBeInTheDocument()
    })
  })

  it('redirects to /games when session is expired', async () => {
    readSession.mockRejectedValue(new Error('expired'))
    renderGame()

    await waitFor(() => {
      expect(screen.getByTestId('games-page')).toBeInTheDocument()
    })
  })
})
