import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useDocumentoField } from '../../hooks/useDocumentoField'
import './newProponente.css'

function NewProponente({ isOpen, onClose, onSave, editingProponente = null }) {
  const isEditMode = editingProponente !== null

  // Initialize form data based on editingProponente
  const getInitialFormData = () => {
    if (editingProponente) {
      return {
        nome: editingProponente.nome || '',
        tipoDocumento: editingProponente.tipoDocumento || 'CPF',
        documento: editingProponente.documento || ''
      }
    }
    return {
      nome: '',
      tipoDocumento: 'CPF',
      documento: ''
    }
  }

  const [formData, setFormData] = useState(getInitialFormData)

  const {
    documentoError,
    setDocumentoError,
    handleDocumentoChange,
    validateDocumentoFormat,
    handleTipoDocumentoChange,
  } = useDocumentoField(formData, setFormData)

  // Update form data when editingProponente changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData())
      setDocumentoError('')
    }
  }, [editingProponente, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate documento format and validity
    if (!validateDocumentoFormat(true)) {
      return
    }

    if (formData.nome && formData.documento) {
      const proponenteData = {
        ...formData,
        id: isEditMode ? editingProponente.id : undefined
      }
      onSave(proponenteData, isEditMode)
      setFormData({
        nome: '',
        tipoDocumento: 'CPF',
        documento: ''
      })
      setDocumentoError('')
      onClose()
    }
  }

  const handleCancel = () => {
    setFormData({
      nome: '',
      tipoDocumento: 'CPF',
      documento: ''
    })
    setDocumentoError('')
    onClose()
  }

  if (!isOpen) return null

  const documentoMaxLength = formData.tipoDocumento === 'CPF' ? 14 : 18
  const documentoPlaceholder = formData.tipoDocumento === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Proponente' : 'Novo Proponente'}</h2>
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
              placeholder="Digite o nome do proponente"
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

export default NewProponente

