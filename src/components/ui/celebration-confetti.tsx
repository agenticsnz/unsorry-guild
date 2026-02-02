'use client'

import { useEffect, useRef } from 'react'

const CONFETTI_SHOWN_KEY = 'guild-hall-confetti-shown'

interface CelebrationConfettiProps {
  trigger?: boolean
  duration?: number
}

/**
 * Check if confetti was already shown this session
 */
function wasConfettiShown(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(CONFETTI_SHOWN_KEY) === 'true'
}

/**
 * Mark confetti as shown for this session
 */
function markConfettiShown(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(CONFETTI_SHOWN_KEY, 'true')
}

// Simple CSS-based confetti for celebration moments
// Only shows once per session to avoid repetitive animations
export function CelebrationConfetti({
  trigger = false,
  duration = 3000,
}: CelebrationConfettiProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Don't show if already shown this session or not triggered
    if (!trigger || !containerRef.current || wasConfettiShown()) return

    // Mark as shown immediately
    markConfettiShown()

    const container = containerRef.current
    const colors = ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d', '#fef3c7']
    const confettiCount = 50

    // Create confetti pieces
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        opacity: 1;
        transform: rotate(${Math.random() * 360}deg);
        animation: confetti-fall ${1.5 + Math.random() * 1.5}s ease-out forwards;
        animation-delay: ${Math.random() * 0.5}s;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      `
      container.appendChild(confetti)
    }

    // Clean up after animation
    const cleanup = setTimeout(() => {
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    }, duration)

    return () => {
      clearTimeout(cleanup)
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    }
  }, [trigger, duration])

  return (
    <>
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none overflow-hidden z-50"
        aria-hidden="true"
      />
    </>
  )
}
