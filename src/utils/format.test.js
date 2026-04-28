import { describe, it, expect } from 'vitest'
import {
  formatCurrencyBRL,
  formatCurrencyBRLReport,
  formatDateBR,
  parseValorBRL,
  toDateInputString,
  calculateRubricasTotal,
} from './format'

// ── formatCurrencyBRL ────────────────────────────────────────────────────────
describe('formatCurrencyBRL', () => {
  it('formats a positive number', () => {
    const result = formatCurrencyBRL(1234.56)
    expect(result).toContain('R$')
    expect(result).toContain('1.234')
    expect(result).toContain('56')
  })

  it('formats zero as R$ 0,00', () => {
    const result = formatCurrencyBRL(0)
    expect(result).toContain('R$')
    expect(result).toContain('0,00')
  })

  it('returns R$ 0,00 for null', () => {
    expect(formatCurrencyBRL(null)).toBe('R$ 0,00')
  })

  it('returns R$ 0,00 for undefined', () => {
    expect(formatCurrencyBRL(undefined)).toBe('R$ 0,00')
  })

  it('returns R$ 0,00 for empty string', () => {
    expect(formatCurrencyBRL('')).toBe('R$ 0,00')
  })

  it('returns R$ 0,00 for non-numeric string', () => {
    expect(formatCurrencyBRL('abc')).toBe('R$ 0,00')
  })
})

// ── formatCurrencyBRLReport ──────────────────────────────────────────────────
describe('formatCurrencyBRLReport', () => {
  it('formats a positive number', () => {
    const result = formatCurrencyBRLReport(500)
    expect(result).toContain('R$')
    expect(result).toContain('500')
  })

  it('returns "-" for null', () => {
    expect(formatCurrencyBRLReport(null)).toBe('-')
  })

  it('returns "-" for undefined', () => {
    expect(formatCurrencyBRLReport(undefined)).toBe('-')
  })

  it('returns "-" for empty string', () => {
    expect(formatCurrencyBRLReport('')).toBe('-')
  })

  it('returns "-" for non-numeric string', () => {
    expect(formatCurrencyBRLReport('abc')).toBe('-')
  })
})

// ── formatDateBR ─────────────────────────────────────────────────────────────
describe('formatDateBR', () => {
  it('converts YYYY-MM-DD string to DD/MM/YYYY', () => {
    expect(formatDateBR('2024-06-15')).toBe('15/06/2024')
  })

  it('returns "-" for null', () => {
    expect(formatDateBR(null)).toBe('-')
  })

  it('returns "-" for undefined', () => {
    expect(formatDateBR(undefined)).toBe('-')
  })

  it('returns "-" for empty string', () => {
    expect(formatDateBR('')).toBe('-')
  })
})

// ── parseValorBRL ─────────────────────────────────────────────────────────────
describe('parseValorBRL', () => {
  it('parses Brazilian format "1.234,56"', () => {
    expect(parseValorBRL('1.234,56')).toBeCloseTo(1234.56)
  })

  it('parses plain decimal "1234.56"', () => {
    expect(parseValorBRL('1234.56')).toBeCloseTo(1234.56)
  })

  it('parses integer string "500"', () => {
    expect(parseValorBRL('500')).toBe(500)
  })

  it('returns 0 for null', () => {
    expect(parseValorBRL(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(parseValorBRL(undefined)).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(parseValorBRL('')).toBe(0)
  })

  it('strips R$ and whitespace', () => {
    expect(parseValorBRL('R$ 250,00')).toBeCloseTo(250)
  })
})

// ── toDateInputString ─────────────────────────────────────────────────────────
describe('toDateInputString', () => {
  it('returns YYYY-MM-DD from an ISO string', () => {
    expect(toDateInputString('2024-03-20T10:00:00Z')).toBe('2024-03-20')
  })

  it('returns YYYY-MM-DD from a plain date string', () => {
    expect(toDateInputString('2024-06-15')).toBe('2024-06-15')
  })

  it('returns null for null', () => {
    expect(toDateInputString(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(toDateInputString(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(toDateInputString('')).toBeNull()
  })
})

// ── calculateRubricasTotal ────────────────────────────────────────────────────
describe('calculateRubricasTotal', () => {
  it('sums valorAprovado across rubricas', () => {
    const rubricas = [
      { valorAprovado: 1000 },
      { valorAprovado: 500.50 },
      { valorAprovado: 250 },
    ]
    expect(calculateRubricasTotal(rubricas)).toBeCloseTo(1750.50)
  })

  it('returns 0 for an empty array', () => {
    expect(calculateRubricasTotal([])).toBe(0)
  })

  it('returns 0 when called with no argument', () => {
    expect(calculateRubricasTotal()).toBe(0)
  })

  it('ignores rubricas with no valorAprovado', () => {
    const rubricas = [{ valorAprovado: 500 }, {}]
    expect(calculateRubricasTotal(rubricas)).toBeCloseTo(500)
  })

  it('ignores non-numeric valorAprovado values', () => {
    const rubricas = [{ valorAprovado: 300 }, { valorAprovado: 'abc' }]
    expect(calculateRubricasTotal(rubricas)).toBeCloseTo(300)
  })
})
