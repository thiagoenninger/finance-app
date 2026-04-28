import { describe, it, expect } from 'vitest'
import {
  CATEGORIA_CONSULTA,
  CATEGORIA_SIMPLIFICADO,
  CATEGORIA_FINANCEIRO,
  CATEGORIA_ADMINISTRADOR,
  CATEGORIAS_USUARIO,
  normalizeCategoria,
} from './userCategories'

describe('CATEGORIAS_USUARIO', () => {
  it('contains exactly 4 categories', () => {
    expect(CATEGORIAS_USUARIO).toHaveLength(4)
  })

  it('contains all expected categories', () => {
    expect(CATEGORIAS_USUARIO).toContain('Consulta')
    expect(CATEGORIAS_USUARIO).toContain('Simplificado')
    expect(CATEGORIAS_USUARIO).toContain('Financeiro')
    expect(CATEGORIAS_USUARIO).toContain('Administrador')
  })

  it('does not contain legacy category names', () => {
    expect(CATEGORIAS_USUARIO).not.toContain('Simples')
    expect(CATEGORIAS_USUARIO).not.toContain('Completo')
  })
})

describe('normalizeCategoria', () => {
  // Legacy value mapping — safety net during/after Firestore migration
  it('maps legacy "Simples" to Consulta', () => {
    expect(normalizeCategoria('Simples')).toBe(CATEGORIA_CONSULTA)
  })

  it('maps legacy "Completo" to Administrador', () => {
    expect(normalizeCategoria('Completo')).toBe(CATEGORIA_ADMINISTRADOR)
  })

  // Valid new values pass through unchanged
  it('passes through Consulta unchanged', () => {
    expect(normalizeCategoria('Consulta')).toBe(CATEGORIA_CONSULTA)
  })

  it('passes through Simplificado unchanged', () => {
    expect(normalizeCategoria('Simplificado')).toBe(CATEGORIA_SIMPLIFICADO)
  })

  it('passes through Financeiro unchanged', () => {
    expect(normalizeCategoria('Financeiro')).toBe(CATEGORIA_FINANCEIRO)
  })

  it('passes through Administrador unchanged', () => {
    expect(normalizeCategoria('Administrador')).toBe(CATEGORIA_ADMINISTRADOR)
  })

  // Unknown / bad values fall back to Consulta (safest default)
  it('falls back to Consulta for an unrecognised value', () => {
    expect(normalizeCategoria('unknown')).toBe(CATEGORIA_CONSULTA)
  })

  it('falls back to Consulta for undefined', () => {
    expect(normalizeCategoria(undefined)).toBe(CATEGORIA_CONSULTA)
  })

  it('falls back to Consulta for empty string', () => {
    expect(normalizeCategoria('')).toBe(CATEGORIA_CONSULTA)
  })

  it('falls back to Consulta for null', () => {
    expect(normalizeCategoria(null)).toBe(CATEGORIA_CONSULTA)
  })
})
