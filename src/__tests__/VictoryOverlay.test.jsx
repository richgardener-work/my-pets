import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import VictoryOverlay from '../features/puzzle/VictoryOverlay'

function renderOverlay(props = {}) {
  return render(
    <MemoryRouter>
      <VictoryOverlay open={true} stars={1} moves={20} seconds={30} {...props} />
    </MemoryRouter>
  )
}

describe('VictoryOverlay', () => {
  it('renders solved heading when open', () => {
    renderOverlay()
    expect(screen.getByText(/solved/i)).toBeInTheDocument()
  })

  it('shows two navigation links: Gallery and All games', () => {
    renderOverlay()
    const gallery = screen.getByRole('link', { name: /gallery/i })
    const allGames = screen.getByRole('link', { name: /all games/i })
    expect(gallery).toHaveAttribute('href', '/gallery')
    expect(allGames).toHaveAttribute('href', '/games')
  })

  it('does not render a Next button', () => {
    renderOverlay()
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull()
  })

  it('renders nothing when open is false', () => {
    renderOverlay({ open: false })
    expect(screen.queryByText(/solved/i)).toBeNull()
  })

  it('renders guestCta when provided', () => {
    renderOverlay({ guestCta: <a href="/">Sign up</a> })
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('does not render guestCta when not provided', () => {
    renderOverlay()
    expect(screen.queryByRole('link', { name: /sign up/i })).toBeNull()
  })
})

describe('VictoryOverlay — senderMessage', () => {
  it('renders senderMessage in quotes when provided', () => {
    renderOverlay({ senderMessage: 'Solve this puzzle!' })
    expect(screen.getByText(/Solve this puzzle!/)).toBeInTheDocument()
  })

  it('does not render "Solved!" heading when senderMessage is provided', () => {
    renderOverlay({ senderMessage: 'Hi there' })
    expect(screen.queryByText(/solved/i)).toBeNull()
  })

  it('renders standard "Solved!" heading when senderMessage is null', () => {
    renderOverlay({ senderMessage: null })
    expect(screen.getByText(/solved/i)).toBeInTheDocument()
  })

  it('renders standard "Solved!" heading when senderMessage is not provided', () => {
    renderOverlay()
    expect(screen.getByText(/solved/i)).toBeInTheDocument()
  })

  it('renders "Upload your own pet" CTA link when senderMessage is provided', () => {
    renderOverlay({ senderMessage: 'Good job!' })
    expect(
      screen.getByRole('link', { name: /upload your own pet/i })
    ).toBeInTheDocument()
  })
})
