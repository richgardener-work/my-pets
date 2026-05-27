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
})
