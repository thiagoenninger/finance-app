export const CATEGORIA_CONSULTA = 'Consulta'
export const CATEGORIA_SIMPLIFICADO = 'Simplificado'
export const CATEGORIA_FINANCEIRO = 'Financeiro'
export const CATEGORIA_ADMINISTRADOR = 'Administrador'

export const CATEGORIAS_USUARIO = [
    CATEGORIA_CONSULTA,
    CATEGORIA_SIMPLIFICADO,
    CATEGORIA_FINANCEIRO,
    CATEGORIA_ADMINISTRADOR,
]

export function normalizeCategoria(value) {
    // Map legacy values from the old 2-category system
    if (value === 'Completo') return CATEGORIA_ADMINISTRADOR
    if (value === 'Simples') return CATEGORIA_CONSULTA
    // Pass through valid new values
    if (CATEGORIAS_USUARIO.includes(value)) return value
    // Default fallback for anything unrecognised
    return CATEGORIA_CONSULTA
}