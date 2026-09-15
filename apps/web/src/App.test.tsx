import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the dashboard placeholder heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /financial dashboard/i })).toBeInTheDocument()
  })
})
