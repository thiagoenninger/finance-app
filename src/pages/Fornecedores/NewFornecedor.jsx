import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { isCpfValid, isCnpjValid } from '../../utils/validation'
import './newFornecedor.css'

function NewFornecedor({ isOpen, onClose, onSave, editingFornecedor = null }) {
  const isEditMode = editingFornecedor !== null

  // Initialize form data based on editingFornecedor
  const getInitialFormData = () => {
    if (editingFornecedor) {
      return {
        razaoSocial: editingFornecedor.razaoSocial || '',
        tipoDocumento: editingFornecedor.tipoDocumento || 'CPF',
        documento: editingFornecedor.documento || '',
        formaPagamento: editingFornecedor.formaPagamento || 'PIX',
        chavePix: editingFornecedor.chavePix || '',
        banco: editingFornecedor.banco || '',
        agencia: editingFornecedor.agencia || '',
        conta: editingFornecedor.conta || ''
      }
    }
    return {
      razaoSocial: '',
      tipoDocumento: 'CPF',
      documento: '',
      formaPagamento: 'PIX',
      chavePix: '',
      banco: '',
      agencia: '',
      conta: ''
    }
  }

  const [formData, setFormData] = useState(getInitialFormData)
  const [documentoError, setDocumentoError] = useState('')

  // Update form data when editingFornecedor changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData())
      setDocumentoError('')
    }
  }, [editingFornecedor, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const formatCPF = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return value
  }

  const formatCNPJ = (value) => {
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

  const handleDocumentoChange = (e) => {
    let value = e.target.value
    
    if (formData.tipoDocumento === 'CPF') {
      value = formatCPF(value)
    } else {
      value = formatCNPJ(value)
    }
    
    setFormData(prev => ({
      ...prev,
      documento: value
    }))

    // Clear error when user starts typing
    if (documentoError) {
      setDocumentoError('')
    }
  }

  const validateDocumentoFormat = (showErrorIfEmpty = false) => {
    if (!formData.documento) {
      if (showErrorIfEmpty) {
        return false
      }
      // Don't show error on blur if empty (required attribute handles it)
      setDocumentoError('')
      return false
    }

    const cleaned = formData.documento.replace(/\D/g, '')
    
    if (formData.tipoDocumento === 'CPF') {
      if (cleaned.length !== 11) {
        setDocumentoError('CPF deve conter 11 dígitos')
        return false
      }
      if (!isCpfValid(formData.documento)) {
        setDocumentoError('CPF inválido. Verifique os dígitos.')
        return false
      }
    } else {
      if (cleaned.length !== 14) {
        setDocumentoError('CNPJ deve conter 14 dígitos')
        return false
      }
      if (!isCnpjValid(formData.documento)) {
        setDocumentoError('CNPJ inválido. Verifique os dígitos.')
        return false
      }
    }

    setDocumentoError('')
    return true
  }

  const handleTipoDocumentoChange = (e) => {
    const newTipo = e.target.value
    setFormData(prev => ({
      ...prev,
      tipoDocumento: newTipo,
      documento: '' // Clear documento when changing type
    }))
    setDocumentoError('')
  }

  const handleFormaPagamentoChange = (e) => {
    const newForma = e.target.value
    setFormData(prev => ({
      ...prev,
      formaPagamento: newForma,
      // Clear payment-specific fields when changing payment method
      chavePix: newForma === 'PIX' ? prev.chavePix : '',
      banco: newForma === 'TED' ? prev.banco : '',
      agencia: newForma === 'TED' ? prev.agencia : '',
      conta: newForma === 'TED' ? prev.conta : ''
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate documento format and validity
    if (!validateDocumentoFormat(true)) {
      return
    }

    // Validate payment method specific fields
    if (formData.formaPagamento === 'PIX' && !formData.chavePix.trim()) {
      return
    }
    if (formData.formaPagamento === 'TED') {
      if (!formData.banco.trim() || !formData.agencia.trim() || !formData.conta.trim()) {
        return
      }
    }

    if (formData.razaoSocial && formData.documento) {
      const fornecedorData = {
        ...formData,
        id: isEditMode ? editingFornecedor.id : undefined
      }
      onSave(fornecedorData, isEditMode)
      setFormData({
        razaoSocial: '',
        tipoDocumento: 'CPF',
        documento: '',
        formaPagamento: 'PIX',
        chavePix: '',
        banco: '',
        agencia: '',
        conta: ''
      })
      setDocumentoError('')
      onClose()
    }
  }

  const handleCancel = () => {
    setFormData({
      razaoSocial: '',
      tipoDocumento: 'CPF',
      documento: '',
      formaPagamento: 'PIX',
      chavePix: '',
      banco: '',
      agencia: '',
      conta: ''
    })
    setDocumentoError('')
    onClose()
  }

  if (!isOpen) return null

  const documentoMaxLength = formData.tipoDocumento === 'CPF' ? 14 : 18
  const documentoPlaceholder = formData.tipoDocumento === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
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
            <label htmlFor="razaoSocial">Razão Social</label>
            <input
              type="text"
              id="razaoSocial"
              name="razaoSocial"
              value={formData.razaoSocial}
              onChange={handleChange}
              required
              autoFocus
              placeholder="Digite a razão social do fornecedor"
            />
          </div>

          <div className="form-field">
            <label htmlFor="tipoDocumento">Tipo de Documento</label>
            <select
              id="tipoDocumento"
              name="tipoDocumento"
              value={formData.tipoDocumento}
              onChange={handleTipoDocumentoChange}
              required
            >
              <option value="CPF">CPF (Pessoa Física)</option>
              <option value="CNPJ">CNPJ (Pessoa Jurídica)</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="documento">
              {formData.tipoDocumento === 'CPF' ? 'CPF' : 'CNPJ'}
            </label>
            <input
              type="text"
              id="documento"
              name="documento"
              value={formData.documento}
              onChange={handleDocumentoChange}
              onBlur={() => validateDocumentoFormat(false)}
              required
              placeholder={documentoPlaceholder}
              maxLength={documentoMaxLength}
              className={documentoError ? 'input-error' : ''}
            />
            {documentoError && (
              <span className="form-error">{documentoError}</span>
            )}
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
            >
              {isEditMode ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewFornecedor

