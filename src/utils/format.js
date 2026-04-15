/* Valor numérico para exibição em Real */

export function formatCurrencyBRL(value) {
    if (value === null || value === undefined || value === "") {
        return 'R$ 0,00'
    }
    const num = Number(value)
    if(Number.isNaN(num)) {
        return 'R$ 0,00'
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
    }).format(num)
}

export function formatCurrencyBRLReport(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  const num = Number(value)
  if (Number.isNaN(num)) {
    return '-'
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(num)
}

/* Exibir data em pt-BR */

export function formatDateBR(value) {
    if (!value) return '-'
    try {
        if (typeof value === 'string' && value.includes('-') && value.length >= 10) {
            const [year, month, day] = value.slice(0, 10).split('-')
            return `${day}/${month}/${year}`
        }
        const d = value?.toDate?.() ? value.toDate() : value instanceof Date ? value : new Date(value)
        if (Number.isNaN(d.getTime())) {
            return typeof value === 'string' ? value : '-'
        }
        return d.toLocaleDateString('pt-BR')
    } catch {
        return '-'
    }
}

/* Converte string de valor monetário para número (suporta R$ 1.234,56 e 1234.56) */

export function parseValorBRL(value) {
  if (value === null || value === undefined) return 0
  let cleaned = String(value).replace(/[R$\s]/g, '').trim()
  if (!cleaned) return 0
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts.length > 2) cleaned = cleaned.replace(/\./g, '')
  }
  return parseFloat(cleaned) || 0
}

/* Normaliza formatos para "yyy-mm-dd" ou null */

export function toDateInputString(value) {
  if (!value) return null
  if (typeof value === 'string' && value.includes('-')) {
    return value.slice(0, 10)
  }
  if (value?.toDate?.()) {
    return value.toDate().toISOString().slice(0, 10)
  }
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}
/* Formata CPF: 000.000.000-00 */

export function formatCPF(value) {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 11) {
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return value
}

/* Formata CNPJ: 00.000.000/0000-00 */

export function formatCNPJ(value) {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 14) {
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }
  return value
}
