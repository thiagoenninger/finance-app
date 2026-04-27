import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { formatCurrencyBRL, parseValorBRL, calculateRubricasTotal } from '../../utils/format'
import './Project.css'
import * as XLSX from 'xlsx'
import { FileSpreadsheet, Upload } from 'lucide-react'

export default function Project() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projeto, setProjeto] = useState(null)
  const [proponentes, setProponentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    pronac: '',
    numeroConta: '',
    nomeProjeto: '',
    proponenteId: '',
    rubricas: []
  })

  const [excelFileName, setExcelFileName] = useState('')
  const [excelError, setExcelError] = useState('')
  
  const [showManualRubricaForm, setShowManualRubricaForm] = useState(false)
  const [manualRubrica, setManualRubrica] = useState({
    produto: '',
    etapa: '',
    local: '',
    tipoRubrica: '',
    valorAprovado: ''
  })

  useEffect(() => {
    fetchProponentes()
    fetchProjeto()
  }, [id])

  const fetchProponentes = async () => {
    try {
      if (!db) {
        throw new Error('Firebase não inicializado')
      }

      const proponentesCollection = collection(db, 'proponentes')
      const proponenteSnapshot = await getDocs(proponentesCollection)

      const proponentesList = []
      proponenteSnapshot.forEach((doc) => {
        proponentesList.push({
          id: doc.id,
          ...doc.data()
        })
      })

      setProponentes(proponentesList)
    } catch (err) {
      console.error('Error fetching proponentes:', err)
    }
  }

  const fetchProjeto = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!db) {
        throw new Error('Firebase não inicializado')
      }

      const projetoRef = doc(db, 'projetos', id)
      const projetoSnap = await getDoc(projetoRef)

      if (!projetoSnap.exists()) {
        throw new Error('Projeto não encontrado')
      }

      const projetoData = {
        id: projetoSnap.id,
        ...projetoSnap.data()
      }

      setProjeto(projetoData)
      setFormData({
        pronac: projetoData.pronac || '',
        numeroConta: projetoData.numeroConta || '',
        nomeProjeto: projetoData.nomeProjeto || '',
        proponenteId: projetoData.proponenteId || '',
        rubricas: projetoData.rubricas || []
      })
    } catch (err) {
      setError('Erro ao carregar projeto: ' + err.message)
      console.error('Error fetching projeto:', err)
    } finally {
      setLoading(false)
    }
  }

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
              valorAprovado = parseValorBRL(valorAprovadoRaw)
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
        } else {
          setFormData(prev => ({
            ...prev,
            rubricas
          }))
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error)
        setExcelError('Erro ao processar o arquivo Excel: ' + error.message)
      }
    }

    reader.onerror = () => {
      setExcelError('Erro ao ler o arquivo Excel')
    }

    reader.readAsArrayBuffer(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()


    if (!formData.pronac || !formData.numeroConta || !formData.nomeProjeto || !formData.proponenteId) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const proponente = proponentes.find(p => p.id === formData.proponenteId)
      const proponenteNome = proponente ? proponente.nome : ''

      const rubricasAtuais = formData.rubricas || []
      
      const valorTotal = rubricasAtuais.reduce((sum, rubrica) => {
        const valor = Number(rubrica.valorAprovado) || 0
        return sum + valor
      }, 0)
      const valorTotalRounded = Math.round(valorTotal * 100) / 100

      const projetoRef = doc(db, 'projetos', id)
      const updateData = {
        pronac: formData.pronac,
        numeroConta: formData.numeroConta,
        nomeProjeto: formData.nomeProjeto,
        proponenteId: formData.proponenteId,
        proponenteNome: proponenteNome,
        rubricas: rubricasAtuais,
        valorTotal: valorTotalRounded,
        updatedAt: new Date()
      }
      
      await updateDoc(projetoRef, updateData)
      
      
      setProjeto(prev => ({
        ...prev,
        ...updateData
      }))

      navigate('/projetos')
    } catch (err) {
      setError('Erro ao salvar projeto: ' + err.message)
      console.error('Error saving project:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/projetos')
  }

const handleManualRubricaChange = (e) => {
    const { name, value } = e.target
    setManualRubrica(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddManualRubrica = () => {
    if (!manualRubrica.produto.trim() || 
        !manualRubrica.etapa.trim() || 
        !manualRubrica.local.trim() || 
        !manualRubrica.tipoRubrica.trim() || 
        !manualRubrica.valorAprovado.trim()) {
      setError('Por favor, preencha todos os campos da rubrica')
      return
    }

    const valorAprovado = parseValorBRL(manualRubrica.valorAprovado)

    if (valorAprovado <= 0) {
      setError('O valor aprovado deve ser maior que zero')
      return
    }

    setFormData(prev => {
      const novaRubrica = {
        produto: manualRubrica.produto.trim(),
        etapa: manualRubrica.etapa.trim(),
        local: manualRubrica.local.trim(),
        tipoRubrica: manualRubrica.tipoRubrica.trim(),
        valorAprovado: valorAprovado
      }
      
      const novasRubricas = [...prev.rubricas, novaRubrica]
      
      
      return {
        ...prev,
        rubricas: novasRubricas
      }
    })

    setManualRubrica({
      produto: '',
      etapa: '',
      local: '',
      tipoRubrica: '',
      valorAprovado: ''
    })
    setShowManualRubricaForm(false)
    setError(null)
  }

  const handleDeleteRubrica = (index) => {
    setFormData(prev => {
      const novasRubricas = prev.rubricas.filter((_, i) => i !== index)
      
      
      return {
        ...prev,
        rubricas: novasRubricas
      }
    })
    setError(null)
  }

  if (loading) {
    return (
      <div className="project-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Carregando...
        </div>
      </div>
    )
  }

  if (error && !projeto) {
    return (
      <div className="project-container">
        <div style={{
          padding: '1rem',
          margin: '1rem',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '8px',
        }}>
          {error}
          <button onClick={() => navigate('/projetos')} style={{ marginLeft: '1rem' }}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="project-container">
      {error && (
        <div style={{
          padding: '1rem',
          margin: '1rem',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '8px',
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '1rem' }}>
            Fechar
          </button>
        </div>
      )}

      <div className="project-header">
        <div className="project-header-content">
          <h1>{formData.nomeProjeto || 'Editar Projeto'}</h1>
          <button 
            className="project-back-button"
            onClick={handleCancel}
            type="button"
            aria-label="Voltar para projetos"
          >
            <ArrowLeft size={18} />
            <span>Voltar</span>
          </button>
        </div>
      </div>

      <form className="project-form" onSubmit={handleSubmit}>
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

        <div className="form-field">
          <button
            type="button"
            className="add-rubrica-button"
            onClick={() => {
              setShowManualRubricaForm(!showManualRubricaForm)
              setError(null)
            }}
          >
            {showManualRubricaForm ? 'Ocultar formulário' : 'Adicionar uma Rubrica manualmente'}
          </button>
        </div>

        {showManualRubricaForm && (
          <div className="manual-rubrica-form">
            <div className="manual-rubrica-fields">
              <div className="form-field">
                <label htmlFor="manualProduto">Produto</label>
                <input
                  type="text"
                  id="manualProduto"
                  name="produto"
                  value={manualRubrica.produto}
                  onChange={handleManualRubricaChange}
                  required
                  placeholder="Digite o produto"
                />
              </div>
              <div className="form-field">
                <label htmlFor="manualEtapa">Etapa</label>
                <input
                  type="text"
                  id="manualEtapa"
                  name="etapa"
                  value={manualRubrica.etapa}
                  onChange={handleManualRubricaChange}
                  required
                  placeholder="Digite a etapa"
                />
              </div>
              <div className="form-field">
                <label htmlFor="manualLocal">Local</label>
                <input
                  type="text"
                  id="manualLocal"
                  name="local"
                  value={manualRubrica.local}
                  onChange={handleManualRubricaChange}
                  required
                  placeholder="Digite o local"
                />
              </div>
              <div className="form-field">
                <label htmlFor="manualTipoRubrica">Tipo de Rubrica</label>
                <input
                  type="text"
                  id="manualTipoRubrica"
                  name="tipoRubrica"
                  value={manualRubrica.tipoRubrica}
                  onChange={handleManualRubricaChange}
                  required
                  placeholder="Digite o tipo de rubrica"
                />
              </div>
              <div className="form-field">
                <label htmlFor="manualValorAprovado">Valor Aprovado</label>
                <input
                  type="text"
                  id="manualValorAprovado"
                  name="valorAprovado"
                  value={manualRubrica.valorAprovado}
                  onChange={handleManualRubricaChange}
                  required
                  placeholder="Ex: 1000,00 ou 1000.00"
                />
              </div>
            </div>
            <div className="manual-rubrica-actions">
              <button
                type="button"
                className="project-button project-button-submit"
                onClick={handleAddManualRubrica}
              >
                Adicionar Rubrica
              </button>
            </div>
          </div>
        )}

        {formData.rubricas.length > 0 && (
          <div className="rubricas-section">
            <div className="rubricas-header">
              <h3>Rubricas ({formData.rubricas.length} {formData.rubricas.length === 1 ? 'rubrica' : 'rubricas'})</h3>
              <div className="valor-total">
                <strong>Valor Total: {formatCurrencyBRL(calculateRubricasTotal(formData.rubricas))}</strong>
              </div>
            </div>
            <div className="rubricas-table-wrapper">
              <table className="rubricas-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Etapa</th>
                    <th>Local</th>
                    <th>Tipo de Rubrica</th>
                    <th>Valor Aprovado</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.rubricas.map((rubrica, index) => (
                    <tr key={index}>
                      <td>{rubrica.produto}</td>
                      <td>{rubrica.etapa}</td>
                      <td>{rubrica.local}</td>
                      <td>{rubrica.tipoRubrica}</td>
                      <td>{formatCurrencyBRL(rubrica.valorAprovado)}</td>
                      <td>
                        <button
                          type="button"
                          className="rubrica-delete-button"
                          onClick={() => handleDeleteRubrica(index)}
                          aria-label="Deletar rubrica"
                          title="Deletar rubrica"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="project-actions">
          <button 
            type="button" 
            className="project-button project-button-cancel"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="project-button project-button-submit"
            disabled={proponentes.length === 0 || saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
