import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/providers/theme-provider'

function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('warm')}>warm</button>
    </div>
  )
}

describe('ThemeProvider default', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('defaults to dark when no preference is stored', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('honors a stored preference over the dark default (toggle preserved)', async () => {
    localStorage.setItem('guild-hall-theme', 'light')
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )
    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })
    expect(screen.getByTestId('resolved').textContent).toBe('light')
  })

  it('setTheme switches the applied theme (toggle still works)', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
    fireEvent.click(screen.getByText('warm'))
    await waitFor(() => {
      expect(document.documentElement.classList.contains('warm')).toBe(true)
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
