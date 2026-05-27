import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from '../pages/ProfilePage'

vi.mock('../hooks/useProfile', () => ({
  useProfile: () => ({
    leaderboard: [
      { uid: 'u1', nickname: 'Мурзик', displayName: 'Ira',  email: 'ira@test.com',  photoURL: null, totalStars: 42, totalGames: 25, puzzlesSolved: 4, photoCount: 7 },
      { uid: 'u2', displayName: 'Rich', email: 'rich@test.com', photoURL: null, totalStars: 35, totalGames: 18, puzzlesSolved: 2, photoCount: 4 },
    ],
    photoCount: 7,
    loading: false,
  }),
}))
vi.mock('../hooks/usePhotos', () => ({
  usePhotos: () => ({ photos: new Array(4).fill({ id: 'p1' }), loading: false }),
}))

const mockGames = { getScore: vi.fn(() => null) }

const baseAuth = (overrides = {}) => ({
  user: null,
  userDoc: null,
  isAuthorized: false,
  signOutUser: vi.fn(),
  updateNickname: vi.fn(),
  ...overrides,
})

describe('ProfilePage', () => {
  test('redirects when not authorized (no hero rendered)', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <ProfilePage auth={baseAuth()} games={mockGames} />
      </MemoryRouter>
    )
    expect(screen.queryByText(/^Hello,/)).toBeNull()
    expect(screen.queryByText('Leaderboard')).toBeNull()
  })

  test('hero — eyebrow, wonky H1 with first name, subtitle', () => {
    render(
      <MemoryRouter>
        <ProfilePage auth={baseAuth({
          isAuthorized: true,
          user: { uid: 'u1', displayName: 'Ira Petrova', email: 'ira@test.com', photoURL: null },
          userDoc: { totalStars: 42, totalGames: 25, allowed: true },
        })} games={mockGames} />
      </MemoryRouter>
    )
    expect(screen.getByText('Just you')).toBeInTheDocument()
    // H1 contains "Hello, Ira" (firstName only, not full displayName)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Hello, Ira(\b|$)/)
    // subtitle embeds star count: "where the N ⭐ live"
    expect(screen.getByText((_, el) => el?.tagName === 'P' && /where the/.test(el.textContent))).toBeInTheDocument()
  })

  test('hero — email and sign-out in right column', () => {
    render(
      <MemoryRouter>
        <ProfilePage auth={baseAuth({
          isAuthorized: true,
          user: { uid: 'u1', displayName: 'Ira', email: 'ira@test.com', photoURL: null },
          userDoc: { totalStars: 42, allowed: true },
        })} games={mockGames} />
      </MemoryRouter>
    )
    expect(screen.getByText('ira@test.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  test('hero — 3 stat pills with correct labels', () => {
    render(
      <MemoryRouter>
        <ProfilePage auth={baseAuth({
          isAuthorized: true,
          user: { uid: 'u1', displayName: 'Ira', email: 'ira@test.com', photoURL: null },
          userDoc: { totalStars: 42, totalGames: 25, allowed: true },
        })} games={mockGames} />
      </MemoryRouter>
    )
    // Stat pill labels as rendered in the component
    expect(screen.getByText('You Upload')).toBeInTheDocument()
    expect(screen.getByText('Puzzles Solved')).toBeInTheDocument()
    expect(screen.getByText('Total Games')).toBeInTheDocument()
    // photoCount = 7 from useProfile mock
    expect(screen.getAllByText('7').length).toBeGreaterThan(0)
    // totalGames = 25 from userDoc
    expect(screen.getAllByText('25').length).toBeGreaterThan(0)
  })

  test('leaderboard — eyebrow + every allowed user row + current user · you suffix', () => {
    render(
      <MemoryRouter>
        <ProfilePage auth={baseAuth({
          isAuthorized: true,
          user: { uid: 'u1', displayName: 'Ira', email: 'ira@test.com', photoURL: null },
          userDoc: { totalStars: 42, totalGames: 25, allowed: true },
        })} games={mockGames} />
      </MemoryRouter>
    )
    expect(screen.getByText('Leaderboard')).toBeInTheDocument()
    // Both users render (Ira may appear in H1 too)
    expect(screen.getAllByText('Ira').length).toBeGreaterThan(0)
    expect(screen.getByText('Rich')).toBeInTheDocument()
    expect(screen.getByText('· you')).toBeInTheDocument()
    // Stars from leaderboard rows: 42 (me) and 35 (other) — both visible
    // 42 may also appear in the hero CountUp, so use getAllByText
    expect(screen.getAllByText('42').length).toBeGreaterThan(0)
    expect(screen.getByText('35')).toBeInTheDocument()
  })

  test('H1 shows nickname instead of Google displayName when nickname is set', () => {
    render(
      <MemoryRouter>
        <ProfilePage auth={baseAuth({
          isAuthorized: true,
          user: { uid: 'u1', displayName: 'Ira Petrova', email: 'ira@test.com', photoURL: null },
          userDoc: { nickname: 'Котёнок', totalStars: 42, totalGames: 25, allowed: true },
        })} games={mockGames} />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Hello, Котёнок/)
  })

  test('leaderboard shows nickname instead of displayName when user has one', () => {
    render(
      <MemoryRouter>
        <ProfilePage auth={baseAuth({
          isAuthorized: true,
          user: { uid: 'u2', displayName: 'Rich', email: 'rich@test.com', photoURL: null },
          userDoc: { totalStars: 35, totalGames: 18, allowed: true },
        })} games={mockGames} />
      </MemoryRouter>
    )
    // u1 in leaderboard mock has nickname: 'Мурзик' — should appear instead of displayName 'Ira'
    expect(screen.getByText('Мурзик')).toBeInTheDocument()
  })

  test('Name edit button renders above stat pills', () => {
    render(
      <MemoryRouter>
        <ProfilePage auth={baseAuth({
          isAuthorized: true,
          user: { uid: 'u1', displayName: 'Ira', email: 'ira@test.com', photoURL: null },
          userDoc: { totalStars: 42, allowed: true },
        })} games={mockGames} />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /name/i })).toBeInTheDocument()
  })

  test('clicking Name button replaces it with a text input', () => {
    render(
      <MemoryRouter>
        <ProfilePage auth={baseAuth({
          isAuthorized: true,
          user: { uid: 'u1', displayName: 'Ira', email: 'ira@test.com', photoURL: null },
          userDoc: { totalStars: 42, allowed: true },
        })} games={mockGames} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /name/i }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /name/i })).toBeNull()
  })

  test('blurring the nickname input calls updateNickname with entered value', () => {
    const updateNickname = vi.fn()
    render(
      <MemoryRouter>
        <ProfilePage auth={baseAuth({
          isAuthorized: true,
          user: { uid: 'u1', displayName: 'Ira', email: 'ira@test.com', photoURL: null },
          userDoc: { totalStars: 42, allowed: true },
          updateNickname,
        })} games={mockGames} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /name/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Котёнок' } })
    fireEvent.blur(screen.getByRole('textbox'))
    expect(updateNickname).toHaveBeenCalledWith('Котёнок')
  })
})
