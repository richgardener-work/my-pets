import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { getDoc } from 'firebase/firestore'
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
  useAuth: () => ({ user: null, userDoc: null, isAuthorized: false }),
}))
vi.mock('../hooks/usePets', () => ({
  usePets: () => ({ pets: [] }),
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

const mockAuth = { user: null, userDoc: null, isAuthorized: false }
const mockGames = { saveScore: vi.fn(), getScore: vi.fn(() => null) }

function renderGame() {
  return render(
    <MemoryRouter initialEntries={['/games/photo-123/3x3']}>
      <Routes>
        <Route
          path="/games/:photoId/:difficulty"
          element={<GameScreen auth={mockAuth} games={mockGames} />}
        />
        <Route path="/games" element={<div data-testid="games-page" />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  imgInstances = []
  vi.stubGlobal('Image', MockImage)
  vi.clearAllMocks()
})

// ── tests ──────────────────────────────────────────────────────────────────
describe('GameScreen — image guard', () => {
  it('shows spinner while photo and image are loading', () => {
    getDoc.mockReturnValue(new Promise(() => {})) // never resolves
    renderGame()
    expect(document.querySelector('.animate-spin')).toBeTruthy()
    expect(screen.queryByTestId('puzzle-board')).toBeNull()
  })

  it('shows puzzle board when image loads successfully', async () => {
    getDoc.mockResolvedValue(mockPhotoSnap)
    renderGame()

    await waitFor(() => expect(imgInstances.length).toBeGreaterThan(0))

    await act(async () => { imgInstances[0].onload?.() })

    expect(screen.getByTestId('puzzle-board')).toBeInTheDocument()
    expect(screen.queryByText('Не удалось загрузить изображение')).toBeNull()
  })

  it('shows error screen when image fails to load', async () => {
    getDoc.mockResolvedValue(mockPhotoSnap)
    renderGame()

    await waitFor(() => expect(imgInstances.length).toBeGreaterThan(0))

    await act(async () => { imgInstances[0].onerror?.() })

    expect(screen.getByText('Не удалось загрузить изображение')).toBeInTheDocument()
    expect(screen.queryByTestId('puzzle-board')).toBeNull()
  })

  it('Back button on error screen navigates to /games', async () => {
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
