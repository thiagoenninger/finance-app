import React, { useState, useEffect } from 'react'
import { X, Upload, Calendar, FileText } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../firebase/firebase'
import './newContaDireta.css'



function NewContaDireta({ isOpen, onClose, onSave, editingConta = null }) {
  const isEditMode = editingConta !== null

  const getInitialFormData = () => {
    if (editingConta) {
      return {
        nome: editingConta.nome || '',
        local: editingConta.local || '',
        valor: editingConta.valor || '',
        dataPagamento: editingConta.dataPagamento || '',
        formaPagamento: editingConta.formaPagamento || 'Boleto',
        chavePix: editingConta.chavePix || '',
        banco: editingConta.banco || '',
        agencia: editingConta.agencia || '',
        conta: editingConta.conta || '',
        boletoFile: null,
        boletoFileName: editingConta.boletoFileName || '',
        boletoUrl: editingConta.boletoUrl || '',
        observacao: editingConta.observacao || ''
      }
    }
    return {
      nome: '',
      local: '',
      valor: '',
      dataPagamento: '',
      formaPagamento: 'Boleto',
      chavePix: '',
      banco: '',
      agencia: '',
      conta: '',
      boletoFile: null,
      boletoFileName: '',
      boletoUrl: '',
      observacao: ''
    }
  }

  const [formData, setFormData] = useState(getInitialFormData)
  const [boletoError, setBoletoError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [contaRecorrente, setContaRecorrente] = useState(false)
  const [recorrenteVezes, setRecorrenteVezes] = useState(2)

  useEffect(() => {
    if (isOpen) {
      if (editingConta) {
        setFormData({
          nome: editingConta.nome || '',
          local: editingConta.local || '',
          valor: editingConta.valor || '',
          dataPagamento: editingConta.dataPagamento || '',
          formaPagamento: editingConta.formaPagamento || 'Boleto',
          chavePix: editingConta.chavePix || '',
          banco: editingConta.banco || '',
          agencia: editingConta.agencia || '',
          conta: editingConta.conta || '',
          boletoFile: null,
          boletoFileName: editingConta.boletoFileName || '',
          boletoUrl: editingConta.boletoUrl || '',
          observacao: editingConta.observacao || ''
        })
      } else {
        setFormData({
          nome: '',
          local: '',
          valor: '',
          dataPagamento: '',
          formaPagamento: 'Boleto',
          chavePix: '',
          banco: '',
          agencia: '',
          conta: '',
          boletoFile: null,
          boletoFileName: '',
          boletoUrl: '',
          observacao: ''
        })
      }
      setBoletoError('')
      setContaRecorrente(false)
      setRecorrenteVezes(2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingConta?.id, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFormaPagamentoChange = (e) => {
    const newForma = e.target.value
    setFormData(prev => ({
      ...prev,
      formaPagamento: newForma,
      chavePix: newForma === 'PIX' ? prev.chavePix : '',
      banco: newForma === 'TED' ? prev.banco : '',
      agencia: newForma === 'TED' ? prev.agencia : '',
      conta: newForma === 'TED' ? prev.conta : '',
      boletoFile: newForma === 'Boleto' ? prev.boletoFile : null,
      boletoFileName: newForma === 'Boleto' ? prev.boletoFileName : '',
      boletoError: ''
    }))
    setBoletoError('')
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
  }

  const handleBoletoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setBoletoError('Por favor, selecione um arquivo PDF')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setBoletoError('O arquivo deve ter no máximo 5MB')
      return
    }

    setBoletoError('')
    
    setFormData(prev => ({
      ...prev,
      boletoFile: file,
      boletoFileName: file.name,
      boletoUrl: ''
    }))
  }

  const uploadBoletoToStorage = async (file, contaId = null) => {
    try {
      const timestamp = Date.now()
      const fileName = contaId 
        ? `boletos/${contaId}_${timestamp}_${file.name}`
        : `boletos/temp_${timestamp}_${file.name}`
      
      const storageRef = ref(storage, fileName)
      
      const snapshot = await uploadBytes(storageRef, file)
      
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return downloadURL
    } catch (error) {
      console.error('Erro ao fazer upload do boleto:', error)
      throw new Error('Erro ao fazer upload do boleto: ' + error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nome || !formData.local || !formData.valor || !formData.dataPagamento || !formData.formaPagamento) {
      return
    }
    if (formData.formaPagamento === 'PIX' && !formData.chavePix.trim()) {
      return
    }
    if (formData.formaPagamento === 'TED') {
      if (!formData.banco.trim() || !formData.agencia.trim() || !formData.conta.trim()) {
        return
      }
    }
    if (formData.formaPagamento === 'Boleto' && !formData.boletoFile && !formData.boletoUrl) {
      setBoletoError('Por favor, anexe o boleto em PDF')
      return
    }

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

    try {
      setUploading(true)
      let boletoUrl = formData.boletoUrl

      if (formData.formaPagamento === 'Boleto' && formData.boletoFile) {
        try {
          boletoUrl = await uploadBoletoToStorage(
            formData.boletoFile, 
            isEditMode ? editingConta.id : null
          )
        } catch (uploadError) {
          console.error('Erro ao fazer upload do boleto:', uploadError)
          setBoletoError('Erro ao fazer upload do boleto. Tente novamente.')
          setUploading(false)
          return
        }
      }

      const contaData = {
        ...formData,
        valor: valorNumerico,
        boletoUrl: boletoUrl,
        id: isEditMode ? editingConta.id : undefined
      }

      const opts = !isEditMode && contaRecorrente && recorrenteVezes >= 2 && recorrenteVezes <= 12
        ? { recorrenteVezes }
        : undefined

      await onSave(contaData, isEditMode, opts)
      setUploading(false)
    
      setFormData({
        nome: '',
        local: '',
        valor: '',
        dataPagamento: '',
        formaPagamento: 'Boleto',
        chavePix: '',
        banco: '',
        agencia: '',
        conta: '',
        boletoFile: null,
        boletoFileName: '',
        boletoUrl: '',
        observacao: ''
      })
      setBoletoError('')
      setContaRecorrente(false)
      setRecorrenteVezes(2)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
      setBoletoError('Erro ao salvar conta. Tente novamente.')
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      nome: '',
      local: '',
      valor: '',
      dataPagamento: '',
      formaPagamento: 'Boleto',
      chavePix: '',
      banco: '',
      agencia: '',
      conta: '',
      boletoFile: null,
      boletoFileName: '',
      boletoUrl: '',
      observacao: ''
    })
    setBoletoError('')
    setContaRecorrente(false)
    setRecorrenteVezes(2)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Conta' : 'Nova Conta'}</h2>
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
          <div className="form-field">
            <label htmlFor="nome">Nome</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              autoFocus
              placeholder="Ex: Aluguel, Internet, etc."
            />
          </div>

          <div className="form-field">
            <label htmlFor="local">Local</label>
            <input
              type="text"
              id="local"
              name="local"
              value={formData.local}
              onChange={handleChange}
              required
              placeholder="Ex: Escritório Principal"
            />
          </div>

          <div className="fields-row">
            <div className="form-field">
              <label htmlFor="valor">Valor (R$)</label>
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

            <div className="form-field">
              <label htmlFor="dataPagamento">Data de Pagamento</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="dataPagamento"
                  name="dataPagamento"
                  value={formData.dataPagamento}
                  onChange={handleChange}
                  required
                />
                <Calendar size={18} className="calendar-icon" />
              </div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="formaPagamento">Forma de Pagamento</label>
            <select
              id="formaPagamento"
              name="formaPagamento"
              value={formData.formaPagamento}
              onChange={handleFormaPagamentoChange}
              required
            >
              <option value="Boleto">Boleto</option>
              <option value="PIX">PIX</option>
              <option value="TED">TED</option>
            </select>
          </div>

          {formData.formaPagamento === 'PIX' && (
            <div className="form-field">
              <label htmlFor="chavePix">Chave PIX</label>
              <input
                type="text"
                id="chavePix"
                name="chavePix"
                value={formData.chavePix}
                onChange={handleChange}
                required
                placeholder="Digite a chave PIX"
              />
            </div>
          )}

          {formData.formaPagamento === 'TED' && (
            <div className="ted-fields-row">
              <div className="form-field">
                <label htmlFor="banco">Banco</label>
                <input
                  type="text"
                  id="banco"
                  name="banco"
                  value={formData.banco}
                  onChange={handleChange}
                  required
                  placeholder="Digite o nome do banco"
                />
              </div>
              <div className="form-field">
                <label htmlFor="agencia">Agência</label>
                <input
                  type="text"
                  id="agencia"
                  name="agencia"
                  value={formData.agencia}
                  onChange={handleChange}
                  required
                  placeholder="Digite a agência"
                />
              </div>
              <div className="form-field">
                <label htmlFor="conta">Conta</label>
                <input
                  type="text"
                  id="conta"
                  name="conta"
                  value={formData.conta}
                  onChange={handleChange}
                  required
                  placeholder="Digite o número da conta"
                />
              </div>
            </div>
          )}

          {formData.formaPagamento === 'Boleto' && (
            <div className="form-field">
              <label htmlFor="boletoFile">
                <FileText size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Anexar Boleto (PDF)
              </label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="boletoFile"
                  accept=".pdf"
                  onChange={handleBoletoFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="boletoFile" className="file-input-label">
                  <Upload size={18} />
                  {formData.boletoFileName || 'Selecionar arquivo PDF'}
                </label>
              </div>
              {boletoError && (
                <span className="form-error">{boletoError}</span>
              )}
              {formData.boletoFileName && !boletoError && (
                <span className="form-hint" style={{ color: '#10b981' }}>
                  ✓ Arquivo selecionado: {formData.boletoFileName}
                </span>
              )}
            </div>
          )}

          {!isEditMode && (
            <div className="form-field conta-recorrente-section">
              <button
                type="button"
                className={`conta-recorrente-btn ${contaRecorrente ? 'active' : ''}`}
                onClick={() => setContaRecorrente((prev) => !prev)}
              >
                Conta recorrente
              </button>
              {contaRecorrente && (
                <div className="conta-recorrente-select-wrap">
                  <label htmlFor="recorrenteVezes">Repetir</label>
                  <select
                    id="recorrenteVezes"
                    value={recorrenteVezes}
                    onChange={(e) => setRecorrenteVezes(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>{n}x</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="observacao">Observação</label>
            <textarea
              id="observacao"
              name="observacao"
              value={formData.observacao}
              onChange={handleChange}
              placeholder="Observações opcionais sobre esta conta..."
              rows={3}
            />
          </div>

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
              disabled={uploading}
            >
              {uploading ? 'Salvando...' : (isEditMode ? 'Salvar' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewContaDireta
