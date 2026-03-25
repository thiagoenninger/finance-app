import React, { useState, useEffect } from 'react'
import { X, Upload, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import './newProject.css'

function NewProject({ isOpen, onClose, onSave, editingProject = null, proponentes = [] }) {
  const isEditMode = editingProject !== null

  const [formData, setFormData] = useState({
    pronac: '',
    numeroConta: '',
    nomeProjeto: '',
    proponenteId: '',
    rubricas: []
  })

  const [excelFileName, setExcelFileName] = useState('')
  const [excelError, setExcelError] = useState('')
  const [rubricasPreview, setRubricasPreview] = useState([])

  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        setFormData({
          pronac: editingProject.pronac || '',
          numeroConta: editingProject.numeroConta || '',
          nomeProjeto: editingProject.nomeProjeto || '',
          proponenteId: editingProject.proponenteId || '',
          rubricas: editingProject.rubricas || []
        })
        setRubricasPreview(editingProject.rubricas || [])
      } else {
        setFormData({
          pronac: '',
          numeroConta: '',
          nomeProjeto: '',
          proponenteId: '',
          rubricas: []
        })
        setRubricasPreview([])
      }
      setExcelFileName('')
      setExcelError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProject?.id, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleExcelFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    const isValidType = validTypes.includes(file.type) || 
                        file.name.endsWith('.xlsx') || 
                        file.name.endsWith('.xls') || 
                        file.name.endsWith('.csv')

    if (!isValidType) {
      setExcelError('Por favor, selecione um arquivo Excel (.xlsx, .xls ou .csv)')
      setExcelFileName('')
      setRubricasPreview([])
      return
    }

    setExcelError('')
    setExcelFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '',
          raw: true
        })
        
        if (jsonData.length < 2) {
          setExcelError('O arquivo Excel deve conter pelo menos uma linha de dados além do cabeçalho')
          setRubricasPreview([])
          return
        }

        const rubricas = []
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          
          if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
            continue
          }

          const produto = row[0]?.toString().trim() || ''
          const etapa = row[1]?.toString().trim() || ''
          const local = row[2]?.toString().trim() || ''
          const tipoRubrica = row[3]?.toString().trim() || ''
          const valorAprovadoRaw = row[4]

          let valorAprovado = 0
          
          if (valorAprovadoRaw !== undefined && valorAprovadoRaw !== null && valorAprovadoRaw !== '') {
            if (typeof valorAprovadoRaw === 'number') {
              valorAprovado = valorAprovadoRaw
            } else {
              const valorAprovadoStr = valorAprovadoRaw.toString().trim()
              
              if (valorAprovadoStr) {
                let cleaned = valorAprovadoStr.replace(/[R$\s]/g, '')
                if (cleaned.includes(',')) {
                  cleaned = cleaned.replace(/\./g, '').replace(',', '.')
                } else if (cleaned.includes('.')) {
                  const parts = cleaned.split('.')
                  if (parts.length > 2) {
                    cleaned = cleaned.replace(/\./g, '')
                  }
                }
                
                valorAprovado = parseFloat(cleaned) || 0
              }
            }
          }

          if (produto) {
            rubricas.push({
              produto,
              etapa,
              local,
              tipoRubrica,
              valorAprovado
            })
          }
        }

        if (rubricas.length === 0) {
          setExcelError('Nenhuma rubrica válida encontrada no arquivo Excel')
          setRubricasPreview([])
        } else {
          const debugSum = rubricas.reduce((sum, r) => sum + (Number(r.valorAprovado) || 0), 0)
          console.log(`Total rubricas: ${rubricas.length}`)
          console.log(`Soma dos valores: R$ ${debugSum.toFixed(2)}`)
          console.log('Primeiras 3 rubricas:', rubricas.slice(0, 3).map(r => ({ 
            produto: r.produto, 
            valor: r.valorAprovado 
          })))
          
          setRubricasPreview(rubricas)
          setFormData(prev => ({
            ...prev,
            rubricas
          }))
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error)
        setExcelError('Erro ao processar o arquivo Excel: ' + error.message)
        setRubricasPreview([])
      }
    }

    reader.onerror = () => {
      setExcelError('Erro ao ler o arquivo Excel')
      setRubricasPreview([])
    }

    reader.readAsArrayBuffer(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (formData.pronac && formData.numeroConta && formData.nomeProjeto && formData.proponenteId) {
      const projectData = {
        ...formData,
        id: isEditMode ? editingProject.id : undefined
      }
      onSave(projectData, isEditMode)
      setFormData({
        pronac: '',
        numeroConta: '',
        nomeProjeto: '',
        proponenteId: '',
        rubricas: []
      })
        setExcelFileName('')
        setRubricasPreview([])
        setExcelError('')
      onClose()
    }
  }

  const handleCancel = () => {
    setFormData({
      pronac: '',
      numeroConta: '',
      nomeProjeto: '',
      proponenteId: '',
      rubricas: []
    })
        setExcelFileName('')
        setRubricasPreview([])
        setExcelError('')
    onClose()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  }

  const calculateValorTotal = () => {
    const total = rubricasPreview.reduce((sum, rubrica) => {
      const valor = Number(rubrica.valorAprovado) || 0
      return sum + valor
    }, 0)
    return Math.round(total * 100) / 100
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Projeto' : 'Novo Projeto'}</h2>
          <button 
            className="modal-close-button" 
            onClick={handleCancel}
            type="button"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="fields-row">
            <div className="form-field">
              <label htmlFor="pronac">PRONAC</label>
              <input
                type="text"
                id="pronac"
                name="pronac"
                value={formData.pronac}
                onChange={handleChange}
                required
                autoFocus
                placeholder="Digite o PRONAC do projeto"
              />
            </div>

            <div className="form-field">
              <label htmlFor="numeroConta">Nº da Conta</label>
              <input
                type="text"
                id="numeroConta"
                name="numeroConta"
                value={formData.numeroConta}
                onChange={handleChange}
                required
                placeholder="Digite o número da conta"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="nomeProjeto">Nome do Projeto</label>
            <input
              type="text"
              id="nomeProjeto"
              name="nomeProjeto"
              value={formData.nomeProjeto}
              onChange={handleChange}
              required
              placeholder="Digite o nome do projeto"
            />
          </div>

          <div className="form-field">
            <label htmlFor="proponenteId">Proponente</label>
            {proponentes.length === 0 ? (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                color: '#856404',
                fontSize: '0.875rem'
              }}>
                Não existem Proponentes registrados no sistema
              </div>
            ) : (
              <select
                id="proponenteId"
                name="proponenteId"
                value={formData.proponenteId}
                onChange={handleChange}
                required
              >
                <option value="">Selecione um proponente</option>
                {proponentes.map((proponente) => (
                  <option key={proponente.id} value={proponente.id}>
                    {proponente.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="excelFile">
              <FileSpreadsheet size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Importar Planilha de Rubricas (Excel)
            </label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="excelFile"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="excelFile" className="file-input-label">
                <Upload size={18} />
                {excelFileName || 'Selecionar arquivo Excel'}
              </label>
            </div>
            {excelError && (
              <span className="form-error">{excelError}</span>
            )}
            {excelFileName && !excelError && (
              <span className="form-hint" style={{ color: '#10b981' }}>
                ✓ Arquivo carregado: {excelFileName}
              </span>
            )}
          </div>

          {rubricasPreview.length > 0 && (
            <div className="rubricas-preview">
              <div className="rubricas-preview-header">
                <h3>Pré-visualização das Rubricas ({rubricasPreview.length} {rubricasPreview.length === 1 ? 'rubrica' : 'rubricas'})</h3>
                <div className="valor-total-preview">
                  <strong>Valor Total: {formatCurrency(calculateValorTotal())}</strong>
                </div>
              </div>
              <div className="rubricas-table-wrapper">
                <table className="rubricas-preview-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Etapa</th>
                      <th>Local</th>
                      <th>Tipo de Rubrica</th>
                      <th>Valor Aprovado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rubricasPreview.slice(0, 10).map((rubrica, index) => (
                      <tr key={index}>
                        <td>{rubrica.produto}</td>
                        <td>{rubrica.etapa}</td>
                        <td>{rubrica.local}</td>
                        <td>{rubrica.tipoRubrica}</td>
                        <td>{formatCurrency(rubrica.valorAprovado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rubricasPreview.length > 10 && (
                  <div className="rubricas-more">
                    <p>... e mais {rubricasPreview.length - 10} {rubricasPreview.length - 10 === 1 ? 'rubrica' : 'rubricas'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="modal-button modal-button-cancel"
              onClick={handleCancel}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="modal-button modal-button-submit"
              disabled={proponentes.length === 0}
            >
              {isEditMode ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProject

