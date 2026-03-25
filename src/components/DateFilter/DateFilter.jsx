import React from 'react'
import './style.css'

function DateFilter({
  idPrefix = '',
  filterDateMode,
  setFilterDateMode,
  filterDate,
  setFilterDate,
  filterDateStart,
  setFilterDateStart,
  filterDateEnd,
  setFilterDateEnd,
}) {
  const p = idPrefix

  return (
    <div className="date-filter-group">
      <div className="date-filter-mode">
        <button
          type="button"
          className={`date-filter-mode-btn ${filterDateMode === 'unica' ? 'active' : ''}`}
          onClick={() => {
            setFilterDateMode('unica')
            setFilterDateStart('')
            setFilterDateEnd('')
          }}
        >
          Data Única
        </button>
        <button
          type="button"
          className={`date-filter-mode-btn ${filterDateMode === 'periodo' ? 'active' : ''}`}
          onClick={() => {
            setFilterDateMode('periodo')
            setFilterDate('')
          }}
        >
          Selecionar Período
        </button>
      </div>

      {filterDateMode === 'unica' ? (
        <div className="date-filter-field">
          <label htmlFor={`${p}filter-date`}>Data</label>
          <input
            type="date"
            id={`${p}filter-date`}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      ) : (
        <>
          <div className="date-filter-field">
            <label htmlFor={`${p}filter-date-start`}>Data inicial</label>
            <input
              type="date"
              id={`${p}filter-date-start`}
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
              max={filterDateEnd || undefined}
            />
          </div>
          <div className="date-filter-field">
            <label htmlFor={`${p}filter-date-end`}>Data final</label>
            <input
              type="date"
              id={`${p}filter-date-end`}
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
              min={filterDateStart || undefined}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default DateFilter
