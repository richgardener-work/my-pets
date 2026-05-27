import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GameSubHeader from '../features/puzzle/GameSubHeader'

vi.mock('../components/CountUp', () => ({
  default: ({ value, className }) => <span className={className}>{value}</span>,
}))

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({ dark: false, toggle: vi.fn() }),
}))

const defaultProps = {
  seconds: 103,
  moves: 12,
  solveEnabled: true,
  autoSolving: false,
  onShuffle: vi.fn(),
  onSolve: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

describe('GameSubHeader — stats', () => {
  it('formats seconds as MM:SS', () => {
    render(<GameSubHeader {...defaultProps} seconds={103} />)
    expect(screen.getByText('01:43')).toBeInTheDocument()
  })

  it('renders move count', () => {
    render(<GameSubHeader {...defaultProps} moves={12} />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})

describe('GameSubHeader — buttons', () => {
  it('calls onShuffle when Shuffle clicked', async () => {
    const user = userEvent.setup()
    const onShuffle = vi.fn()
    render(<GameSubHeader {...defaultProps} onShuffle={onShuffle} />)
    await user.click(screen.getByRole('button', { name: /shuffle/i }))
    expect(onShuffle).toHaveBeenCalledTimes(1)
  })

  it('calls onSolve when Solve clicked', async () => {
    const user = userEvent.setup()
    const onSolve = vi.fn()
    render(<GameSubHeader {...defaultProps} solveEnabled={true} onSolve={onSolve} />)
    await user.click(screen.getByRole('button', { name: /solve/i }))
    expect(onSolve).toHaveBeenCalledTimes(1)
  })

  it('does not render Solve when solveEnabled is false', () => {
    render(<GameSubHeader {...defaultProps} solveEnabled={false} />)
    expect(screen.queryByRole('button', { name: /solve/i })).not.toBeInTheDocument()
  })

  it('disables Solve while autoSolving', () => {
    render(<GameSubHeader {...defaultProps} solveEnabled={true} autoSolving={true} />)
    expect(screen.getByRole('button', { name: /solve/i })).toBeDisabled()
  })
})

describe('GameSubHeader — share button', () => {
  it('does not render Share button when shareUrl is not provided', () => {
    render(<GameSubHeader {...defaultProps} />)
    expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument()
  })

  it('renders Share button when shareUrl is provided', () => {
    render(<GameSubHeader {...defaultProps} shareUrl="https://example.com/my-pets/share/abc/3x3" />)
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
  })

  it('calls navigator.share when Share is clicked and navigator.share is available', async () => {
    const user = userEvent.setup()
    const mockShare = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share: mockShare, clipboard: undefined })
    render(<GameSubHeader {...defaultProps} shareUrl="https://example.com/my-pets/share/abc/3x3" />)
    await user.click(screen.getByRole('button', { name: /share/i }))
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Play this pet puzzle!',
      url: 'https://example.com/my-pets/share/abc/3x3',
    })
  })

  it('copies to clipboard when navigator.share is not available', async () => {
    const user = userEvent.setup()
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText: mockWriteText } })
    render(<GameSubHeader {...defaultProps} shareUrl="https://example.com/my-pets/share/abc/3x3" />)
    await user.click(screen.getByRole('button', { name: /share/i }))
    expect(mockWriteText).toHaveBeenCalledWith('https://example.com/my-pets/share/abc/3x3')
  })
})
