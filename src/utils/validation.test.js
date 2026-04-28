import { describe, it, expect } from 'vitest'
import { isCpfValid, isCnpjValid } from './validation'

// ── isCpfValid ────────────────────────────────────────────────────────────────
describe('isCpfValid', () => {
  it('returns true for a valid CPF (with formatting)', () => {
    // Known valid CPF
    expect(isCpfValid('529.982.247-25')).toBe(true)
  })

  it('returns true for a valid CPF (digits only)', () => {
    expect(isCpfValid('52998224725')).toBe(true)
  })

  it('returns false for a CPF with wrong check digits', () => {
    expect(isCpfValid('529.982.247-00')).toBe(false)
  })

  it('returns false for all-same digits (111.111.111-11)', () => {
    expect(isCpfValid('111.111.111-11')).toBe(false)
  })

  it('returns false for all zeros', () => {
    expect(isCpfValid('000.000.000-00')).toBe(false)
  })

  it('returns false for a CPF that is too short', () => {
    expect(isCpfValid('123.456.789')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isCpfValid('')).toBe(false)
  })

  it('returns false for null / undefined', () => {
    expect(isCpfValid(null)).toBe(false)
    expect(isCpfValid(undefined)).toBe(false)
  })
})

// ── isCnpjValid ───────────────────────────────────────────────────────────────
describe('isCnpjValid', () => {
  it('returns true for a valid CNPJ (with formatting)', () => {
    // Known valid CNPJ
    expect(isCnpjValid('11.222.333/0001-81')).toBe(true)
  })

  it('returns true for a valid CNPJ (digits only)', () => {
    expect(isCnpjValid('11222333000181')).toBe(true)
  })

  it('returns false for a CNPJ with wrong check digits', () => {
    expect(isCnpjValid('11.222.333/0001-00')).toBe(false)
  })

  it('returns false for all-same digits (00.000.000/0000-00)', () => {
    expect(isCnpjValid('00.000.000/0000-00')).toBe(false)
  })

  it('returns false for all-same digits (11.111.111/1111-11)', () => {
    expect(isCnpjValid('11.111.111/1111-11')).toBe(false)
  })

  it('returns false for a CNPJ that is too short', () => {
    expect(isCnpjValid('11.222.333')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isCnpjValid('')).toBe(false)
  })

  it('returns false for null / undefined', () => {
    expect(isCnpjValid(null)).toBe(false)
    expect(isCnpjValid(undefined)).toBe(false)
  })
})
