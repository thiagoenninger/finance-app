import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateRelatorioDetalhadoRows } from './relatorioDetalhadoReport'

// ── Firebase mock ─────────────────────────────────────────────────────────────
// We mock the entire firebase/firestore module so tests never touch the network.
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, name) => ({ _name: name })),
  getDocs: vi.fn(),
  query: vi.fn((ref, ...constraints) => ({ ...ref, _constraints: constraints })),
  where: vi.fn((field, op, value) => ({ field, op, value })),
}))

import { getDocs, collection } from 'firebase/firestore'

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Build a fake Firestore snapshot from an array of { id, data } objects. */
function makeSnap(docs) {
  const fakeDocs = docs.map(({ id, data }) => ({
    id,
    data: () => data,
    ...data,
  }))
  return {
    forEach: (fn) => fakeDocs.forEach(fn),
    docs: fakeDocs,
    empty: fakeDocs.length === 0,
  }
}

const mockDb = {}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Edge cases ────────────────────────────────────────────────────────────────
describe('generateRelatorioDetalhadoRows — edge cases', () => {
  it('returns [] when filterPronac is empty', async () => {
    const rows = await generateRelatorioDetalhadoRows({ db: mockDb, filterPronac: '' })
    expect(rows).toEqual([])
    expect(getDocs).not.toHaveBeenCalled()
  })

  it('returns [] when filterPronac is only whitespace', async () => {
    const rows = await generateRelatorioDetalhadoRows({ db: mockDb, filterPronac: '   ' })
    expect(rows).toEqual([])
  })

  it('returns [] when no pagamentos match the PRONAC', async () => {
    getDocs.mockResolvedValueOnce(makeSnap([
      { id: 'p1', data: { pronac: 'OTHER123', rubricaNome: 'Rubrica A' } },
    ]))
    const rows = await generateRelatorioDetalhadoRows({ db: mockDb, filterPronac: 'ABC999' })
    expect(rows).toEqual([])
  })

  it('returns [] when matching pagamentos have no baixas', async () => {
    // First getDocs call: pagamentos
    getDocs.mockResolvedValueOnce(makeSnap([
      { id: 'p1', data: { pronac: 'ABC123', rubricaNome: 'Rubrica A', fornecedorId: 'f1' } },
    ]))
    // Second getDocs call: baixas for p1 — empty
    getDocs.mockResolvedValueOnce(makeSnap([]))
    // Third getDocs call: fornecedor f1
    getDocs.mockResolvedValueOnce(makeSnap([
      { id: 'f1', data: { tipoDocumento: 'CNPJ', documento: '11.222.333/0001-81' } },
    ]))

    const rows = await generateRelatorioDetalhadoRows({ db: mockDb, filterPronac: 'ABC123' })
    expect(rows).toEqual([])
  })
})

// ── Happy path ────────────────────────────────────────────────────────────────
describe('generateRelatorioDetalhadoRows — happy path', () => {
  it('returns one row per baixa for a pagamento', async () => {
    getDocs
      // pagamentos
      .mockResolvedValueOnce(makeSnap([
        {
          id: 'p1',
          data: {
            pronac: 'ABC123',
            rubricaNome: 'Rubrica Produção',
            fornecedorId: 'f1',
            fornecedorNome: 'Empresa X',
            numeroNF: 'NF-001',
            notaFiscalUrl: 'https://storage.example.com/nf001.pdf',
            notaFiscalFileName: 'nf001.pdf',
          },
        },
      ]))
      // baixas for p1
      .mockResolvedValueOnce(makeSnap([
        {
          id: 'b1',
          data: {
            pagamentoId: 'p1',
            dataPagamento: '2024-05-10',
            valorPago: 1500,
            numeroPagamento: 'PAG-001',
          },
        },
      ]))
      // fornecedor f1
      .mockResolvedValueOnce(makeSnap([
        { id: 'f1', data: { tipoDocumento: 'CNPJ', documento: '11.222.333/0001-81' } },
      ]))

    const rows = await generateRelatorioDetalhadoRows({ db: mockDb, filterPronac: 'ABC123' })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      pronac: 'ABC123',
      rubrica: 'Rubrica Produção',
      documentoFornecedor: 'CNPJ: 11.222.333/0001-81',
      numeroNF: 'NF-001',
      numeroPagamento: 'PAG-001',
      valorPago: 1500,
      notaFiscalUrl: 'https://storage.example.com/nf001.pdf',
    })
  })

  it('formats dataPagamento as DD/MM/YYYY', async () => {
    getDocs
      .mockResolvedValueOnce(makeSnap([
        { id: 'p1', data: { pronac: 'ABC123', fornecedorId: 'f1', rubricaNome: 'R', numeroNF: '1' } },
      ]))
      .mockResolvedValueOnce(makeSnap([
        { id: 'b1', data: { pagamentoId: 'p1', dataPagamento: '2024-11-03', valorPago: 100, numeroPagamento: '1' } },
      ]))
      .mockResolvedValueOnce(makeSnap([
        { id: 'f1', data: { tipoDocumento: 'CPF', documento: '529.982.247-25' } },
      ]))

    const rows = await generateRelatorioDetalhadoRows({ db: mockDb, filterPronac: 'ABC123' })
    expect(rows[0].dataPagamento).toBe('03/11/2024')
  })
})

// ── Date filter ───────────────────────────────────────────────────────────────
describe('generateRelatorioDetalhadoRows — date filter', () => {
  function setupOnePagamentoWithBaixa(dataPagamento) {
    getDocs
      .mockResolvedValueOnce(makeSnap([
        { id: 'p1', data: { pronac: 'ABC123', fornecedorId: 'f1', rubricaNome: 'R', numeroNF: '1' } },
      ]))
      .mockResolvedValueOnce(makeSnap([
        { id: 'b1', data: { pagamentoId: 'p1', dataPagamento, valorPago: 200, numeroPagamento: '1' } },
      ]))
      .mockResolvedValueOnce(makeSnap([
        { id: 'f1', data: { tipoDocumento: 'CPF', documento: '529.982.247-25' } },
      ]))
  }

  it('includes a baixa whose date falls within the period', async () => {
    setupOnePagamentoWithBaixa('2024-06-15')
    const rows = await generateRelatorioDetalhadoRows({
      db: mockDb,
      filterPronac: 'ABC123',
      filterDateStart: '2024-06-01',
      filterDateEnd: '2024-06-30',
    })
    expect(rows).toHaveLength(1)
  })

  it('excludes a baixa whose date is before the period', async () => {
    setupOnePagamentoWithBaixa('2024-05-31')
    const rows = await generateRelatorioDetalhadoRows({
      db: mockDb,
      filterPronac: 'ABC123',
      filterDateStart: '2024-06-01',
      filterDateEnd: '2024-06-30',
    })
    expect(rows).toHaveLength(0)
  })

  it('excludes a baixa whose date is after the period', async () => {
    setupOnePagamentoWithBaixa('2024-07-01')
    const rows = await generateRelatorioDetalhadoRows({
      db: mockDb,
      filterPronac: 'ABC123',
      filterDateStart: '2024-06-01',
      filterDateEnd: '2024-06-30',
    })
    expect(rows).toHaveLength(0)
  })

  it('shows all baixas when no date filter is provided', async () => {
    setupOnePagamentoWithBaixa('2023-01-01')
    const rows = await generateRelatorioDetalhadoRows({
      db: mockDb,
      filterPronac: 'ABC123',
      // no filterDateStart / filterDateEnd
    })
    expect(rows).toHaveLength(1)
  })
})

// ── Sort order ────────────────────────────────────────────────────────────────
describe('generateRelatorioDetalhadoRows — sort order', () => {
  it('returns rows sorted by dataPagamento descending', async () => {
    getDocs
      // pagamentos — two pagamentos for the same PRONAC
      .mockResolvedValueOnce(makeSnap([
        { id: 'p1', data: { pronac: 'ABC123', fornecedorId: 'f1', rubricaNome: 'R', numeroNF: '1' } },
        { id: 'p2', data: { pronac: 'ABC123', fornecedorId: 'f1', rubricaNome: 'R', numeroNF: '2' } },
      ]))
      // baixas for p1 — older date
      .mockResolvedValueOnce(makeSnap([
        { id: 'b1', data: { pagamentoId: 'p1', dataPagamento: '2024-03-01', valorPago: 100, numeroPagamento: '1' } },
      ]))
      // baixas for p2 — newer date
      .mockResolvedValueOnce(makeSnap([
        { id: 'b2', data: { pagamentoId: 'p2', dataPagamento: '2024-06-01', valorPago: 200, numeroPagamento: '2' } },
      ]))
      // fornecedor f1 (queried once since both share the same fornecedorId)
      .mockResolvedValueOnce(makeSnap([
        { id: 'f1', data: { tipoDocumento: 'CPF', documento: '529.982.247-25' } },
      ]))

    const rows = await generateRelatorioDetalhadoRows({ db: mockDb, filterPronac: 'ABC123' })

    expect(rows).toHaveLength(2)
    // Newer date should come first
    expect(rows[0].dataPagamento).toBe('01/06/2024')
    expect(rows[1].dataPagamento).toBe('01/03/2024')
  })
})
