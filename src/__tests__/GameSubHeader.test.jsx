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
