import React, { useState, useEffect } from 'react'
import { X, Upload, Calendar, FileText } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../firebase/firebase'
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import './newPagamento.css'

function NewPagamento({ isOpen, onClose, onSave, editingPagamento = null }) {
  const isEditMode = editingPagamento !== null

  const [projetos, setProjetos] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [rubricasDisponiveis, setRubricasDisponiveis] = useState([])
  const [saldoDisponivel, setSaldoDisponivel] = useState(null)
  const [uploading, setUploading] = useState(false)

  const getInitialFormData = () => {
    if (editingPagamento) {
      const initialData = {
        projetoId: editingPagamento.projetoId || '',
        projetoNome: editingPagamento.projetoNome || '',
        pronac: editingPagamento.pronac || '',
        rubricaId: editingPagamento.rubricaId || '',
        rubricaNome: editingPagamento.rubricaNome || '',
        fornecedorId: editingPagamento.fornecedorId || '',
        fornecedorNome: editingPagamento.fornecedorNome || '',
        numeroNF: editingPagamento.numeroNF || '',
        valor: editingPagamento.valor || '',
        notaFiscalFile: null,
        notaFiscalFileName: editingPagamento.notaFiscalFileName || '',
        notaFiscalUrl: editingPagamento.notaFiscalUrl || '',
        dataPrevistaPagamento: editingPagamento.dataPrevistaPagamento || '',
        tipoPagamento: editingPagamento.tipoPagamento || 'À Vista'
      }
      // Só incluir numeroParcelas se o tipo for "Parcelado"
      if (initialData.tipoPagamento === 'Parcelado') {
        initialData.numeroParcelas = editingPagamento.numeroParcelas || 1
      }
      return initialData
    }
    return {
      projetoId: '',
      projetoNome: '',
      pronac: '',
      rubricaId: '',
      rubricaNome: '',
      fornecedorId: '',
      fornecedorNome: '',
      numeroNF: '',
      valor: '',
      notaFiscalFile: null,
      notaFiscalFileName: '',
      notaFiscalUrl: '',
      dataPrevistaPagamento: '',
      tipoPagamento: 'À Vista'
      // numeroParcelas não é incluído por padrão, pois o tipo padrão é "À Vista"
    }
  }

  const [formData, setFormData] = useState(getInitialFormData)
  const [notaFiscalError, setNotaFiscalError] = useState('')
  const [saldoError, setSaldoError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchProjetos()
      fetchFornecedores()
      if (editingPagamento) {
        const initialData = getInitialFormData()
        setFormData(initialData)
        if (editingPagamento.projetoId) {
          loadRubricasFromProject(editingPagamento.projetoId).then(() => {
            // Após carregar rubricas, calcular saldo se rubrica estiver selecionada
            if (editingPagamento.rubricaId) {
              calculateSaldoDisponivel(editingPagamento.projetoId, editingPagamento.rubricaId)
            }
          })
        }
      } else {
        setFormData(getInitialFormData())
        setRubricasDisponiveis([])
        setSaldoDisponivel(null)
      }
      setNotaFiscalError('')
      setSaldoError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPagamento?.id, isOpen])

  const fetchProjetos = async () => {
    try {
      if (!db) return

      const projetosCollection = collection(db, 'projetos')
      const projetosSnapshot = await getDocs(projetosCollection)

      const projetosList = []
      projetosSnapshot.forEach((doc) => {
        projetosList.push({
          id: doc.id,
          ...doc.data()
        })
      })

      setProjetos(projetosList)
    } catch (err) {
      console.error('Error fetching projetos:', err)
    }
  }

  const fetchFornecedores = async () => {
    try {
      if (!db) return

      const fornecedoresCollection = collection(db, 'fornecedores')
      const fornecedoresSnapshot = await getDocs(fornecedoresCollection)

      const fornecedoresList = []
      fornecedoresSnapshot.forEach((doc) => {
        fornecedoresList.push({
          id: doc.id,
          ...doc.data()
        })
      })

      setFornecedores(fornecedoresList)
    } catch (err) {
      console.error('Error fetching fornecedores:', err)
    }
  }

  const loadRubricasFromProject = async (projetoId) => {
    try {
      if (!db || !projetoId) {
        setRubricasDisponiveis([])
        return Promise.resolve()
      }

      const projetoRef = doc(db, 'projetos', projetoId)
      const projetoSnap = await getDoc(projetoRef)

      if (!projetoSnap.exists()) {
        setRubricasDisponiveis([])
        return Promise.resolve()
      }

      const projetoData = projetoSnap.data()
      const rubricas = projetoData.rubricas || []

      // Criar lista de rubricas com índice único
      const rubricasList = rubricas.map((rubrica, index) => ({
        id: index.toString(),
        ...rubrica
      }))

      setRubricasDisponiveis(rubricasList)
      setSaldoDisponivel(null)
      return Promise.resolve()
    } catch (err) {
      console.error('Error loading rubricas:', err)
      setRubricasDisponiveis([])
      return Promise.resolve()
    }
  }

  const calculateSaldoDisponivel = async (projetoId, rubricaIndex) => {
    try {
      if (!db || !projetoId || rubricaIndex === null || rubricaIndex === undefined) {
        setSaldoDisponivel(null)
        return
      }

      const projetoRef = doc(db, 'projetos', projetoId)
      const projetoSnap = await getDoc(projetoRef)

      if (!projetoSnap.exists()) {
        setSaldoDisponivel(null)
        return
      }

      const projetoData = projetoSnap.data()
      const rubricas = projetoData.rubricas || []
      const rubrica = rubricas[parseInt(rubricaIndex)]

      if (!rubrica) {
        setSaldoDisponivel(null)
        return
      }

      // Buscar todos os pagamentos para esta rubrica
      const pagamentosCollection = collection(db, 'pagamentos')
      const pagamentosSnapshot = await getDocs(pagamentosCollection)

      let totalPago = 0
      pagamentosSnapshot.forEach((doc) => {
        const pagamento = doc.data()
        // Verificar se o pagamento é para esta rubrica (mesmo projeto e mesmo índice de rubrica)
        if (pagamento.projetoId === projetoId && pagamento.rubricaId === rubricaIndex.toString()) {
          // Se estiver editando, não contar o pagamento atual (será substituído pelo novo valor)
          if (!isEditMode || doc.id !== editingPagamento?.id) {
            totalPago += Number(pagamento.valor) || 0
          }
        }
      })

      // Calcular saldo: valorAprovado - total já pago
      const valorAprovado = Number(rubrica.valorAprovado) || 0
      const saldo = valorAprovado - totalPago

      setSaldoDisponivel(saldo)
    } catch (err) {
      console.error('Error calculating saldo:', err)
      setSaldoDisponivel(null)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      }
      // Se mudou para "À Vista", remover numeroParcelas
      if (name === 'tipoPagamento' && value === 'À Vista') {
        delete newData.numeroParcelas
      }
      // Se mudou para "Parcelado" e não tem numeroParcelas, definir como 1
      if (name === 'tipoPagamento' && value === 'Parcelado' && !newData.numeroParcelas) {
        newData.numeroParcelas = 1
      }
      return newData
    })
  }

  const handleFornecedorChange = (e) => {
    const fornecedorId = e.target.value
    const fornecedor = fornecedores.find(f => f.id === fornecedorId)

    if (fornecedor) {
      setFormData(prev => ({
        ...prev,
        fornecedorId: fornecedor.id,
        fornecedorNome: fornecedor.razaoSocial
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        fornecedorId: '',
        fornecedorNome: ''
      }))
    }
  }

  const handleProjetoChange = async (e) => {
    const projetoId = e.target.value
    const projeto = projetos.find(p => p.id === projetoId)

    if (projeto) {
      setFormData(prev => ({
        ...prev,
        projetoId: projeto.id,
        projetoNome: projeto.nomeProjeto,
        pronac: projeto.pronac,
        rubricaId: '', // Reset rubrica when project changes
        rubricaNome: ''
      }))
      await loadRubricasFromProject(projetoId)
      setSaldoDisponivel(null)
    } else {
      setFormData(prev => ({
        ...prev,
        projetoId: '',
        projetoNome: '',
        pronac: '',
        rubricaId: '',
        rubricaNome: ''
      }))
      setRubricasDisponiveis([])
      setSaldoDisponivel(null)
    }
  }

  const handleRubricaChange = async (e) => {
    const rubricaId = e.target.value
    const rubrica = rubricasDisponiveis.find(r => r.id === rubricaId)

    if (rubrica) {
      setFormData(prev => ({
        ...prev,
        rubricaId: rubrica.id,
        rubricaNome: `${rubrica.produto} - ${rubrica.etapa}`
      }))
      await calculateSaldoDisponivel(formData.projetoId, rubrica.id)
    } else {
      setFormData(prev => ({
        ...prev,
        rubricaId: '',
        rubricaNome: ''
      }))
      setSaldoDisponivel(null)
    }
  }

  const handleValorChange = (e) => {
    let value = e.target.value
    
    value = value.replace(/[^\d,.-]/g, '')
    
    const hasComma = value.includes(',')
    const hasDot = value.includes('.')
    
    if (hasComma && hasDot) {
      const lastComma = value.lastIndexOf(',')
      const lastDot = value.lastIndexOf('.')
      if (lastComma > lastDot) {
        value = value.replace(/\./g, '')
      } else {
        value = value.replace(/,/g, '')
      }
    }
    
    setFormData(prev => ({
      ...prev,
      valor: value
    }))
    
    // Validar saldo em tempo real
    if (saldoDisponivel !== null && value) {
      let valorNumerico = 0
      const valorStr = value.toString().trim()
      
      if (valorStr) {
        let cleaned = valorStr.replace(/[R$\s]/g, '')
        if (cleaned.includes(',')) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.')
        } else if (cleaned.includes('.')) {
          const parts = cleaned.split('.')
          if (parts.length > 2) {
            cleaned = cleaned.replace(/\./g, '')
          }
        }
        
        valorNumerico = parseFloat(cleaned) || 0
      }

      if (valorNumerico > saldoDisponivel) {
        setSaldoError('A rubrica não tem saldo suficiente para este valor.')
      } else {
        setSaldoError('')
      }
    }
  }

  const handleNotaFiscalFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setNotaFiscalError('Por favor, selecione um arquivo PDF')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotaFiscalError('O arquivo deve ter no máximo 5MB')
      return
    }

    setNotaFiscalError('')
    
    setFormData(prev => ({
      ...prev,
      notaFiscalFile: file,
      notaFiscalFileName: file.name,
      notaFiscalUrl: ''
    }))
  }

  const uploadNotaFiscalToStorage = async (file, pagamentoId = null) => {
    try {
      const timestamp = Date.now()
      const fileName = pagamentoId 
        ? `notas-fiscais/${pagamentoId}_${timestamp}_${file.name}`
        : `notas-fiscais/temp_${timestamp}_${file.name}`
      
      const storageRef = ref(storage, fileName)
      
      const snapshot = await uploadBytes(storageRef, file)
      
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return downloadURL
    } catch (error) {
      console.error('Erro ao fazer upload da nota fiscal:', error)
      throw new Error('Erro ao fazer upload da nota fiscal: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar campos obrigatórios
    if (!formData.projetoId || !formData.rubricaId || !formData.fornecedorId || 
        !formData.numeroNF || !formData.valor || !formData.dataPrevistaPagamento || 
        !formData.tipoPagamento) {
      return
    }

    // Validar parcelas se for parcelado
    if (formData.tipoPagamento === 'Parcelado' && (!formData.numeroParcelas || formData.numeroParcelas < 1 || formData.numeroParcelas > 12)) {
      return
    }

    // Converter valor para número
    let valorNumerico = 0
    const valorStr = formData.valor.toString().trim()
    
    if (valorStr) {
      let cleaned = valorStr.replace(/[R$\s]/g, '')
      if (cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.')
      } else if (cleaned.includes('.')) {
        const parts = cleaned.split('.')
        if (parts.length > 2) {
          cleaned = cleaned.replace(/\./g, '')
        }
      }
      
      valorNumerico = parseFloat(cleaned) || 0
    }

    if (valorNumerico <= 0) {
      return
    }

    // Validar saldo
    if (saldoDisponivel !== null && valorNumerico > saldoDisponivel) {
      setSaldoError('A rubrica não tem saldo suficiente para este valor.')
      return
    }

    try {
      setUploading(true)
      setSaldoError('')
      let notaFiscalUrl = formData.notaFiscalUrl

      // Fazer upload do PDF se houver arquivo novo
      if (formData.notaFiscalFile) {
        try {
          notaFiscalUrl = await uploadNotaFiscalToStorage(
            formData.notaFiscalFile, 
            isEditMode ? editingPagamento.id : null
          )
        } catch (uploadError) {
          console.error('Erro ao fazer upload da nota fiscal:', uploadError)
          setNotaFiscalError('Erro ao fazer upload da nota fiscal. Tente novamente.')
          setUploading(false)
          return
        }
      }

      // Preparar dados do pagamento
      const pagamentoData = {
        ...formData,
        valor: valorNumerico,
        notaFiscalUrl: notaFiscalUrl,
        id: isEditMode ? editingPagamento.id : undefined
      }

      // Se o tipo de pagamento for "À Vista", não incluir numeroParcelas
      if (pagamentoData.tipoPagamento === 'À Vista') {
        delete pagamentoData.numeroParcelas
      }

      // Salvar o pagamento primeiro
      await onSave(pagamentoData, isEditMode)

      // Atualizar saldo da rubrica no projeto (sempre recalcula baseado em todos os pagamentos)
      await updateRubricaSaldo(formData.projetoId, formData.rubricaId)
      setUploading(false)
    
      // Limpar formulário
      setFormData({
        projetoId: '',
        projetoNome: '',
        pronac: '',
        rubricaId: '',
        rubricaNome: '',
        fornecedorId: '',
        fornecedorNome: '',
        numeroNF: '',
        valor: '',
        notaFiscalFile: null,
        notaFiscalFileName: '',
        notaFiscalUrl: '',
        dataPrevistaPagamento: '',
        tipoPagamento: 'À Vista'
        // numeroParcelas não é incluído por padrão, pois o tipo padrão é "À Vista"
      })
      setRubricasDisponiveis([])
      setSaldoDisponivel(null)
      setNotaFiscalError('')
      setSaldoError('')
      onClose()
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error)
      setNotaFiscalError('Erro ao salvar pagamento. Tente novamente.')
      setUploading(false)
    }
  }

  const updateRubricaSaldo = async (projetoId, rubricaId) => {
    try {
      if (!db || !projetoId || rubricaId === null || rubricaId === undefined) {
        return
      }

      const projetoRef = doc(db, 'projetos', projetoId)
      const projetoSnap = await getDoc(projetoRef)

      if (!projetoSnap.exists()) {
        return
      }

      const projetoData = projetoSnap.data()
      const rubricas = [...(projetoData.rubricas || [])]
      const rubricaIndex = parseInt(rubricaId)

      if (rubricas[rubricaIndex]) {
        const valorAprovado = Number(rubricas[rubricaIndex].valorAprovado) || 0
        
        // Buscar todos os pagamentos para esta rubrica específica
        const pagamentosCollection = collection(db, 'pagamentos')
        const pagamentosSnapshot = await getDocs(pagamentosCollection)

        let totalPago = 0
        pagamentosSnapshot.forEach((doc) => {
          const pagamento = doc.data()
          // Somar apenas pagamentos desta rubrica específica (mesmo projeto e mesmo índice de rubrica)
          if (pagamento.projetoId === projetoId && pagamento.rubricaId === rubricaId) {
            totalPago += Number(pagamento.valor) || 0
          }
        })

        // Calcular e salvar o saldo
        const saldo = valorAprovado - totalPago
        rubricas[rubricaIndex] = {
          ...rubricas[rubricaIndex],
          saldo: Math.round(saldo * 100) / 100
        }

        // Atualizar o projeto
        await updateDoc(projetoRef, {
          rubricas: rubricas,
          updatedAt: new Date()
        })
      }
    } catch (err) {
      console.error('Error updating rubrica saldo:', err)
      throw err
    }
  }

  const handleCancel = () => {
    setFormData({
      projetoId: '',
      projetoNome: '',
      pronac: '',
      rubricaId: '',
      rubricaNome: '',
      fornecedorId: '',
      fornecedorNome: '',
      numeroNF: '',
      valor: '',
      notaFiscalFile: null,
      notaFiscalFileName: '',
      notaFiscalUrl: '',
      dataPrevistaPagamento: '',
      tipoPagamento: 'À Vista'
      // numeroParcelas não é incluído por padrão, pois o tipo padrão é "À Vista"
    })
    setRubricasDisponiveis([])
    setSaldoDisponivel(null)
    setNotaFiscalError('')
    setSaldoError('')
    onClose()
  }

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Pagamento' : 'Novo Pagamento'}</h2>
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
              <label htmlFor="projetoId">Projeto</label>
              {projetos.length === 0 ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  color: '#856404',
                  fontSize: '0.875rem'
                }}>
                  Não existem Projetos registrados no sistema
                </div>
              ) : (
                <select
                  id="projetoId"
                  name="projetoId"
                  value={formData.projetoId}
                  onChange={handleProjetoChange}
                  required
                >
                  <option value="">Selecione um projeto</option>
                  {projetos.map((projeto) => (
                    <option key={projeto.id} value={projeto.id}>
                      {projeto.nomeProjeto}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="pronac">PRONAC</label>
              <input
                type="text"
                id="pronac"
                name="pronac"
                value={formData.pronac}
                readOnly
                className="readonly-input"
                placeholder="Será preenchido automaticamente"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="rubricaId">Rubrica</label>
            {!formData.projetoId ? (
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0f0f0',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                Selecione um projeto primeiro
              </div>
            ) : rubricasDisponiveis.length === 0 ? (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                color: '#856404',
                fontSize: '0.875rem'
              }}>
                Este projeto não possui rubricas cadastradas
              </div>
            ) : (
              <>
                <select
                  id="rubricaId"
                  name="rubricaId"
                  value={formData.rubricaId}
                  onChange={handleRubricaChange}
                  required
                >
                  <option value="">Selecione uma rubrica</option>
                  {rubricasDisponiveis.map((rubrica) => (
                    <option key={rubrica.id} value={rubrica.id}>
                      {rubrica.produto} - {rubrica.etapa}
                    </option>
                  ))}
                </select>
                {formData.rubricaId && saldoDisponivel !== null && (
                  <div className="saldo-disponivel-box">
                    <span className="saldo-label">Saldo disponível nesta rubrica:</span>
                    <span className="saldo-value">{formatCurrency(saldoDisponivel)}</span>
                  </div>
                )}
                {saldoError && (
                  <span className="form-error">{saldoError}</span>
                )}
              </>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="fornecedorId">Fornecedor</label>
            {fornecedores.length === 0 ? (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                color: '#856404',
                fontSize: '0.875rem'
              }}>
                Não existem Fornecedores registrados no sistema
              </div>
            ) : (
              <select
                id="fornecedorId"
                name="fornecedorId"
                value={formData.fornecedorId}
                onChange={handleFornecedorChange}
                required
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.razaoSocial}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="fields-row">
            <div className="form-field">
              <label htmlFor="numeroNF">Número da NF</label>
              <input
                type="text"
                id="numeroNF"
                name="numeroNF"
                value={formData.numeroNF}
                onChange={handleChange}
                required
                placeholder="Digite o número da NF"
              />
            </div>

            <div className="form-field">
              <label htmlFor="valor">Valor R$</label>
              <input
                type="text"
                id="valor"
                name="valor"
                value={formData.valor}
                onChange={handleValorChange}
                required
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="notaFiscalFile">
              <FileText size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Anexar Nota Fiscal (PDF)
            </label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="notaFiscalFile"
                accept=".pdf"
                onChange={handleNotaFiscalFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="notaFiscalFile" className="file-input-label">
                <Upload size={18} />
                {formData.notaFiscalFileName || 'Selecionar arquivo PDF'}
              </label>
            </div>
            {notaFiscalError && (
              <span className="form-error">{notaFiscalError}</span>
            )}
            {formData.notaFiscalFileName && !notaFiscalError && (
              <span className="form-hint" style={{ color: '#10b981' }}>
                ✓ Arquivo selecionado: {formData.notaFiscalFileName}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="dataPrevistaPagamento">Data Prevista de Pagamento</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                id="dataPrevistaPagamento"
                name="dataPrevistaPagamento"
                value={formData.dataPrevistaPagamento}
                onChange={handleChange}
                required
              />
              <Calendar size={18} className="calendar-icon" />
            </div>
          </div>

          {formData.tipoPagamento === 'Parcelado' ? (
            <div className="fields-row">
              <div className="form-field">
                <label htmlFor="tipoPagamento">Tipo de Pagamento</label>
                <select
                  id="tipoPagamento"
                  name="tipoPagamento"
                  value={formData.tipoPagamento}
                  onChange={handleChange}
                  required
                >
                  <option value="À Vista">À Vista</option>
                  <option value="Parcelado">Parcelado</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="numeroParcelas">Número de Parcelas</label>
                <select
                  id="numeroParcelas"
                  name="numeroParcelas"
                  value={formData.numeroParcelas}
                  onChange={handleChange}
                  required
                >
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                  <option value="4">4x</option>
                  <option value="5">5x</option>
                  <option value="6">6x</option>
                  <option value="7">7x</option>
                  <option value="8">8x</option>
                  <option value="9">9x</option>
                  <option value="10">10x</option>
                  <option value="11">11x</option>
                  <option value="12">12x</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="form-field">
              <label htmlFor="tipoPagamento">Tipo de Pagamento</label>
              <select
                id="tipoPagamento"
                name="tipoPagamento"
                value={formData.tipoPagamento}
                onChange={handleChange}
                required
              >
                <option value="À Vista">À Vista</option>
                <option value="Parcelado">Parcelado</option>
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="modal-button modal-button-cancel"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="modal-button modal-button-submit"
              disabled={projetos.length === 0 || fornecedores.length === 0 || uploading || !!saldoError}
            >
              {uploading ? 'Salvando...' : (isEditMode ? 'Salvar' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewPagamento
