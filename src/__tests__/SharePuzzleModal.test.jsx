import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SharePuzzleModal from '../components/SharePuzzleModal'

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({ dark: false, toggle: vi.fn() }),
}))

vi.mock('../utils/createShare', () => ({
  createShareDoc: vi.fn().mockResolvedValue({
    shareId: 'abc12345',
    url: 'https://example.com/my-pets/s/abc12345',
  }),
}))

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  photoId: 'photo-abc',
  difficulty: '3x3',
  senderUid: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    share: undefined,
  })
})

describe('SharePuzzleModal — rendering', () => {
  it('renders header "Share Puzzle" when open', () => {
    render(<SharePuzzleModal {...defaultProps} />)
    expect(screen.getByText('Share Puzzle')).toBeInTheDocument()
  })

  it('renders textarea placeholder', () => {
    render(<SharePuzzleModal {...defaultProps} />)
    expect(screen.getByPlaceholderText(/write a short message/i)).toBeInTheDocument()
  })

  it('renders expiry hint "Link valid for 24 hours"', () => {
    render(<SharePuzzleModal {...defaultProps} />)
    expect(screen.getByText(/link valid for 24 hours/i)).toBeInTheDocument()
  })

  it('renders nothing when open is false', () => {
    render(<SharePuzzleModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Share Puzzle')).toBeNull()
  })

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SharePuzzleModal {...defaultProps} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('SharePuzzleModal — counter and validation', () => {
  it('shows counter "0 / 200" initially', () => {
    render(<SharePuzzleModal {...defaultProps} />)
    expect(screen.getByText('0 / 200')).toBeInTheDocument()
  })

  it('updates counter as user types', async () => {
    const user = userEvent.setup()
    render(<SharePuzzleModal {...defaultProps} />)
    await user.type(screen.getByPlaceholderText(/write a short message/i), 'Hello')
    expect(screen.getByText('5 / 200')).toBeInTheDocument()
  })

  it('Copy button is disabled when message is empty', () => {
    render(<SharePuzzleModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: /^copy$/i })).toBeDisabled()
  })

  it('Share button is disabled when message is empty', () => {
    render(<SharePuzzleModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: /^share$/i })).toBeDisabled()
  })

  it('Copy button is enabled after typing', async () => {
    const user = userEvent.setup()
    render(<SharePuzzleModal {...defaultProps} />)
    await user.type(screen.getByPlaceholderText(/write a short message/i), 'Hi')
    expect(screen.getByRole('button', { name: /^copy$/i })).not.toBeDisabled()
  })

  it('does not allow typing more than 200 characters', async () => {
    const user = userEvent.setup()
    render(<SharePuzzleModal {...defaultProps} />)
    const longText = 'a'.repeat(250)
    await user.type(screen.getByPlaceholderText(/write a short message/i), longText)
    expect(screen.getByPlaceholderText(/write a short message/i)).toHaveValue('a'.repeat(200))
  })
})

describe('SharePuzzleModal — Copy action', () => {
  it('calls createShareDoc with correct params on Copy click', async () => {
    const user = userEvent.setup()
    const { createShareDoc } = await import('../utils/createShare')
    render(<SharePuzzleModal {...defaultProps} />)
    await user.type(screen.getByPlaceholderText(/write a short message/i), 'Hello friend')
    await user.click(screen.getByRole('button', { name: /^copy$/i }))
    await waitFor(() => expect(createShareDoc).toHaveBeenCalledWith({
      message: 'Hello friend',
      photoId: 'photo-abc',
      difficulty: '3x3',
      senderUid: null,
    }))
  })

  it('calls clipboard.writeText with the returned url on Copy click', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText }, share: undefined })
    render(<SharePuzzleModal {...defaultProps} />)
    await user.type(screen.getByPlaceholderText(/write a short message/i), 'Hi')
    await user.click(screen.getByRole('button', { name: /^copy$/i }))
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        'https://example.com/my-pets/s/abc12345'
      )
    )
  })

  it('shows Check icon briefly after successful Copy', async () => {
    const user = userEvent.setup()
    render(<SharePuzzleModal {...defaultProps} />)
    await user.type(screen.getByPlaceholderText(/write a short message/i), 'Hi')
    await user.click(screen.getByRole('button', { name: /^copy$/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument())
  })
})

describe('SharePuzzleModal — Share action (navigator.share)', () => {
  it('calls navigator.share with correct url when available', async () => {
    const user = userEvent.setup()
    const mockShare = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share: mockShare, clipboard: { writeText: vi.fn() } })
    render(<SharePuzzleModal {...defaultProps} />)
    await user.type(screen.getByPlaceholderText(/write a short message/i), 'Try this!')
    await user.click(screen.getByRole('button', { name: /^share$/i }))
    await waitFor(() =>
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Play this pet puzzle!',
        url: 'https://example.com/my-pets/s/abc12345',
      })
    )
  })

  it('falls back to clipboard.writeText when navigator.share is unavailable', async () => {
    const user = userEvent.setup()
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share: undefined, clipboard: { writeText: mockWriteText } })
    render(<SharePuzzleModal {...defaultProps} />)
    await user.type(screen.getByPlaceholderText(/write a short message/i), 'Try!')
    await user.click(screen.getByRole('button', { name: /^share$/i }))
    await waitFor(() =>
      expect(mockWriteText).toHaveBeenCalledWith('https://example.com/my-pets/s/abc12345')
    )
  })
})
