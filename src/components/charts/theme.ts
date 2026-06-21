// Shared Chart.js styling so every chart reads consistently (DRY, ADR-023).
// "claude orange" brand accent matches the --brand CSS token (SPEC-021-B).
export const BRAND = 'hsl(14, 70%, 62%)'
export const BRAND_FILL = 'hsla(14, 70%, 62%, 0.15)'

const GRID = 'rgba(148, 163, 184, 0.18)'
const TICK = 'rgba(148, 163, 184, 0.9)'

/** Tooltip styling — readable on the dark default theme. */
export const TOOLTIP = {
  backgroundColor: 'rgba(2, 6, 23, 0.92)',
  borderColor: 'rgba(148, 163, 184, 0.25)',
  borderWidth: 1,
  padding: 8,
  titleColor: '#f8fafc',
  bodyColor: '#e2e8f0',
}

export const axisTick = { color: TICK }
export const gridLines = { color: GRID }
export const gridHidden = { display: false as const }
