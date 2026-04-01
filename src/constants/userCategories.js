export const CATEGORIA_SIMPLES = 'Simples'
export const CATEGORIA_COMPLETO = 'Completo'

export const CATEGORIAS_USUARIO = [CATEGORIA_SIMPLES, CATEGORIA_COMPLETO]

export function normalizeCategoria(value) {
    if (value === CATEGORIA_COMPLETO) return CATEGORIA_COMPLETO
    return CATEGORIA_SIMPLES
}