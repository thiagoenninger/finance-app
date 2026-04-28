import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownCircle } from 'lucide-react'
import Button from '../../../components/Button/Button'
import { db } from '../../../firebase/firebase'
import { generateRelatorioDetalhadoRows } from './relatorioDetalhadoReport'
import { formatCurrencyBRLReport } from '../../../utils/format'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import './style.css'

function RelatorioDetalhado() {
  const navigate = useNavigate()

  const [filterPronac, setFilterPronac] = useState('')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')

  const [reportRows, setReportRows] = useState([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  const hasValidFilters = !!filterPronac.trim()

  const handleClearReport = () => {
    setHasGenerated(false)
    setReportRows([])
    setReportError(null)
    setReportLoading(false)
  }

  const handleGenerateReport = async () => {
    if (!hasValidFilters) return
    if (!db) {
      setReportError('Firebase não inicializado')
      return
    }

    try {
      setReportLoading(true)
      setReportError(null)
      setHasGenerated(false)
      setReportRows([])

      const rows = await generateRelatorioDetalhadoRows({
        db,
        filterPronac,
        filterDateStart,
        filterDateEnd,
      })

      setReportRows(rows)
      setHasGenerated(true)
    } catch (err) {
      setReportError('Erro ao gerar relatório: ' + (err?.message || String(err)))
    } finally {
      setReportLoading(false)
    }
  }

  const handleSaveReport = () => {
    if (!hasGenerated || reportRows.length === 0) return

    try {
      const doc = new jsPDF({ orientation: 'landscape', format: 'a4' })
      const now = new Date()
      const pad2 = (n) => String(n).padStart(2, '0')
      const dateLabel = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`
      const fileName = `Relatorio_Detalhado_${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}.pdf`

      doc.setFontSize(14)
      doc.text('Relatório Detalhado de Pagamentos', 14, 14)
      doc.setFontSize(10)
      doc.text(`Pronac: ${filterPronac.trim()}   Gerado em: ${dateLabel}`, 14, 20)

      const head = [[
        'PRONAC',
        'Rubrica',
        'CNPJ/CPF Fornecedor',
        'Nº NF',
        'Data Emissão NF',
        'Data Pagamento',
        'Nº Pagamento',
        'Valor Pago',
      ]]

      const body = reportRows.map((row) => [
        row.pronac,
        row.rubrica,
        row.documentoFornecedor,
        row.numeroNF,
        row.dataEmissaoNF,
        row.dataPagamento,
        row.numeroPagamento,
        row.valorPago !== '-' ? formatCurrencyBRLReport(row.valorPago) : '-',
      ])

      autoTable(doc, {
        head,
        body,
        startY: 26,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [18, 27, 48] },
        margin: { left: 10, right: 10 },
      })

      doc.save(fileName)
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
    }
  }

  return (
    <div className="rel-det-page">
      {/* Header */}
      <div className="rel-det-header">
        <div className="rel-det-header-text">
          <h1>Relatório Detalhado</h1>
          <p>Pagamentos com baixa registrada por PRONAC</p>
        </div>
        <Button
          label="Voltar"
          onClick={() => navigate('/relatorios')}
          icon={<span style={{ fontSize: '1rem', lineHeight: 1 }}>←</span>}
        />
      </div>

      {/* Filters */}
      <div className="rel-det-filters">
        <div className="rel-det-filters-row">

          {/* PRONAC */}
          <div className="rel-det-filter-field">
            <label htmlFor="rd-pronac">PRONAC</label>
            <input
              id="rd-pronac"
              type="text"
              value={filterPronac}
              onChange={(e) => setFilterPronac(e.target.value)}
              placeholder="Digite o PRONAC..."
            />
          </div>

          {/* Period */}
          <div className="rel-det-filter-field">
            <label htmlFor="rd-date-start">Período de</label>
            <input
              id="rd-date-start"
              type="date"
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
            />
          </div>

          <div className="rel-det-filter-field">
            <label htmlFor="rd-date-end">até</label>
            <input
              id="rd-date-end"
              type="date"
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
            />
          </div>

          {/* Clear */}
          <button
            type="button"
            className="rel-det-btn-clear"
            onClick={() => {
              setFilterPronac('')
              setFilterDateStart('')
              setFilterDateEnd('')
            }}
            disabled={!filterPronac && !filterDateStart && !filterDateEnd}
          >
            Limpar Filtros
          </button>

          {/* Actions — pushed to the right */}
          <div className="rel-det-filters-actions">
            <button
              type="button"
              className="rel-det-btn-generate"
              disabled={!hasValidFilters || reportLoading}
              onClick={handleGenerateReport}
            >
              {reportLoading ? 'Carregando...' : 'Gerar Relatório'}
            </button>

            {hasGenerated && reportRows.length > 0 && (
              <button
                type="button"
                className="rel-det-btn-save"
                onClick={handleSaveReport}
                disabled={reportLoading}
              >
                Salvar Relatório
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {reportError && (
        <div className="rel-det-error">{reportError}</div>
      )}

      {/* Table */}
      {hasGenerated && (
        <div className="rel-det-table-container">
          {reportLoading ? (
            <div className="rel-det-state-msg">Carregando...</div>
          ) : reportRows.length === 0 ? (
            <div className="rel-det-state-msg">
              Nenhum pagamento com baixa encontrado para os filtros informados.
            </div>
          ) : (
            <div className="rel-det-table-wrapper">
              <table className="rel-det-table">
                <thead>
                  <tr>
                    <th>PRONAC</th>
                    <th>Rubrica</th>
                    <th>CNPJ/CPF Fornecedor</th>
                    <th>Nº NF</th>
                    <th>Data Emissão NF</th>
                    <th>Data Pagamento</th>
                    <th>Nº Pagamento</th>
                    <th>Valor Pago</th>
                    <th>NF</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.pronac}</td>
                      <td>{row.rubrica}</td>
                      <td>{row.documentoFornecedor}</td>
                      <td>{row.numeroNF}</td>
                      <td>{row.dataEmissaoNF}</td>
                      <td>{row.dataPagamento}</td>
                      <td>{row.numeroPagamento}</td>
                      <td>
                        {row.valorPago !== '-'
                          ? formatCurrencyBRLReport(row.valorPago)
                          : '-'}
                      </td>
                      <td>
                        {row.notaFiscalUrl ? (
                          <a
                            href={row.notaFiscalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rel-det-nf-download"
                            title={row.notaFiscalFileName || 'Baixar Nota Fiscal'}
                            aria-label="Baixar Nota Fiscal"
                          >
                            <ArrowDownCircle size={18} />
                          </a>
                        ) : (
                          <span className="rel-det-nf-none">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Clear FAB */}
      <button
        type="button"
        className="rel-det-clear-fab"
        onClick={handleClearReport}
        disabled={!hasGenerated}
        aria-label="Limpar Relatório"
      >
        Limpar Relatório
      </button>
    </div>
  )
}

export default RelatorioDetalhado
