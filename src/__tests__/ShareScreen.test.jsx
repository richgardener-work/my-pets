import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { getDoc } from 'firebase/firestore'
import ShareScreen from '../pages/ShareScreen'

vi.mock('../firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}))
vi.mock('../features/puzzle/PuzzleBoard', () => ({
  default: () => <div data-testid="puzzle-board" />,
}))
vi.mock('../features/puzzle/VictoryOverlay', () => ({
  default: ({ guestCta }) => (
    <div data-testid="victory-overlay">{guestCta}</div>
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
  autoSolveMoves: vi.fn(() => []),
}))

let imgInstances = []
class MockImage {
  constructor() { imgInstances.push(this) }
  set src(_) {}
}

const mockPhotoSnap = {
  exists: () => true,
  id: 'photo-abc',
  data: () => ({
    imageUrl: 'https://example.com/cat.jpg',
    mediumUrl: 'https://example.com/cat-medium.jpg',
  }),
}

const notFoundSnap = { exists: () => false }

function renderShare({ photoId = 'photo-abc', difficulty = '3x3' } = {}) {
  return render(
    <MemoryRouter initialEntries={[`/share/${photoId}/${difficulty}`]}>
      <Routes>
        <Route path="/share/:photoId/:difficulty" element={<ShareScreen />} />
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

describe('ShareScreen — loading', () => {
  it('shows spinner while loading', () => {
    getDoc.mockReturnValue(new Promise(() => {}))
    renderShare()
    expect(document.querySelector('.animate-spin')).toBeTruthy()
    expect(screen.queryByTestId('puzzle-board')).toBeNull()
  })
})

describe('ShareScreen — not found', () => {
  it('shows error with home button when photoId does not exist', async () => {
    getDoc.mockResolvedValue(notFoundSnap)
    renderShare()
    await waitFor(() => {
      expect(screen.getByText(/photo not found/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument()
  })
})

describe('ShareScreen — invalid difficulty', () => {
  it('redirects to / when difficulty is unknown', async () => {
    getDoc.mockResolvedValue(mockPhotoSnap)
    renderShare({ difficulty: 'invalid' })
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
  })
})

describe('ShareScreen — happy path', () => {
  it('renders puzzle board when image loads', async () => {
    getDoc.mockResolvedValue(mockPhotoSnap)
    renderShare()
    await waitFor(() => expect(imgInstances.length).toBeGreaterThan(0))
    await act(async () => { imgInstances[0].onload?.() })
    expect(screen.getByTestId('puzzle-board')).toBeInTheDocument()
  })

  it('renders guestCta inside VictoryOverlay', async () => {
    getDoc.mockResolvedValue(mockPhotoSnap)
    renderShare()
    await waitFor(() => expect(imgInstances.length).toBeGreaterThan(0))
    await act(async () => { imgInstances[0].onload?.() })
    expect(screen.getByTestId('victory-overlay')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /upload your own pet/i })).toBeInTheDocument()
  })
})
