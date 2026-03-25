import React, { useState } from "react";
import "./style.css";

import { generateRelatoriosReportRows } from "./relatoriosReport";

import DateFilter from "../../components/DateFilter/DateFilter";
import { db } from "../../firebase/firebase";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-"
  const num = Number(value)
  if (Number.isNaN(num)) return "-"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(num)
}


function Relatorios() {
  const [filterPronac, setFilterPronac] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDateMode, setFilterDateMode] = useState('unica');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  const hasValidFilters =
    !!filterPronac.trim();

  const [reportRows, setReportRows] = useState([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  const handleClearReport = () => {
    setHasGenerated(false)
    setReportRows([])
    setReportError(null)
    setReportLoading(false)
  }

  const handleSaveReport = () => {
    if (!hasGenerated || !reportRows || reportRows.length === 0) return

    const doc = new jsPDF({orientation: 'portrait', format: 'a4'})
    const now = new Date()
    const pad2 = (n) => String(n).padStart(2, '0')
    const dateLabel = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`
    const fileName = `Relatorio_Pagamentos_${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}.pdf`

    doc.setFontSize(14)
    doc.text("Relatório de Pagamentos", 14, 14)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${dateLabel}`, 14, 20)

    const head=[[
      "Pronac",
      "Rubrica",
      "Valor da Rubrica",
      "Fornecedor",
      "Nº Nota Fiscal",
      "Valor Nota Fiscal",
    ]]

    const body = reportRows.map((row) => [
      row.pronac ?? "-",
      row.rubrica ?? "-",
      row.valorRubrica === "-" ? "-" : formatCurrency(row.valorRubrica),
      row.fornecedor ?? "-",
      row.numeroNF ?? "-",
      row.valorNotaFiscal === "-" ? "-" : formatCurrency(row.valorNotaFiscal),
    ])

    autoTable(doc, {
      head,
      body,
      startY: 26,
      theme: 'grid',
      styles: {fontSize: 10, cellPadding: 2.5},
      headStyles: {fillColor: [18, 27, 48]},
      margin: {left: 10, right: 10}
    })

    doc.save(fileName)
  }

  const handleGenerateReport = async () => {
    if (!hasValidFilters) return
    if (!db) {
      setReportError("Firebase não inicializado")
      return
    }

    try {
      setReportLoading(true)
      setReportError(null)
      setHasGenerated(false)
      setReportRows([])

      const rows = await generateRelatoriosReportRows({
        db,
        filterPronac,
        filterDateMode,
        filterDate,
        filterDateStart,
        filterDateEnd,
      })

      setReportRows(rows)
      setHasGenerated(true)
    } catch (err) {
      setReportError("Erro ao gerar relatório: " + (err?.message || String(err)))
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className="relatorios-page">
      <div className="relatorios-page-header">
        <h1>Relatórios</h1>
        <p>Exporte relatórios dos pagamentos dos projetos ou contas diretas</p>
      </div>

      <div className="relatorios-filters">
        <div className="relatorios-filters-row">
          <div className="relatorios-filters-field">
            <label htmlFor="filter-pronac">Pronac</label>
            <input
              type="text"
              id="filter-pronac"
              value={filterPronac}
              onChange={(e) => setFilterPronac(e.target.value)}
              placeholder="Pronac..."
            />
          </div>

          <DateFilter
            idPrefix="relatorios-"
            filterDateMode={filterDateMode}
            setFilterDateMode={setFilterDateMode}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            filterDateStart={filterDateStart}
            setFilterDateStart={setFilterDateStart}
            filterDateEnd={filterDateEnd}
            setFilterDateEnd={setFilterDateEnd}
          />

          <button
            type="button"
            className="relatorios-filter-clear"
            onClick={() => {
              setFilterPronac('')
              setFilterDate('')
              setFilterDateStart('')
              setFilterDateEnd('')
            }}
            disabled={!filterPronac.trim() && !filterDate && !(filterDateStart && filterDateEnd)}
          >
            Limpar Filtros
          </button>

          <div className="relatorios-filters-right-actions">
            <button
              type="button"
              className="relatorios-filter-generate"
              disabled={!hasValidFilters || reportLoading}
              onClick={handleGenerateReport}
            >
              Gerar Relatório
            </button>
            
            {hasGenerated && (
              <button
                type="button"
                className="relatorios-filter-save"
                onClick={handleSaveReport}
                disabled={reportLoading || reportRows.length === 0}
              >
                Salvar Relatório
              </button>
            )}
          </div>
        </div>
      </div>

      {reportError && <div className="relatorios-report-error">{reportError}</div>}

      {hasGenerated && (
        <div className="relatorios-report-table-container">
          {reportLoading ? (
            <div className="relatorios-report-loading">Carregando...</div>
          ) : reportRows.length === 0 ? (
            <div className="relatorios-report-empty">Nenhum pagamento encontrado para os filtros informados.</div>
          ) : (
            <div className="relatorios-report-table-wrapper">
              <table className="relatorios-report-table">
                <thead>
                  <tr>
                    <th>Pronac</th>
                    <th>Rubrica</th>
                    <th>Valor da Rubrica</th>
                    <th>Fornecedor</th>
                    <th>Nº Nota Fiscal</th>
                    <th>Valor Nota Fiscal (em R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.pronac}</td>
                      <td>{row.rubrica}</td>
                      <td>{row.valorRubrica === "-" ? "-" : formatCurrency(row.valorRubrica)}</td>
                      <td>{row.fornecedor}</td>
                      <td>{row.numeroNF}</td>
                      <td>{row.valorNotaFiscal === "-" ? "-" : formatCurrency(row.valorNotaFiscal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="relatorios-clear-report-fab"
        onClick={handleClearReport}
        disabled={!hasGenerated}
        aria-label="Limpar Relatório"
      >
        Limpar Relatório
      </button>
    </div>
  );
}

export default Relatorios;
