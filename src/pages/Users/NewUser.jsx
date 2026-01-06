import React, { useState } from 'react'
import { X } from 'lucide-react'
import './newUser.css'

function NewUser({ isOpen, onClose, onSave, editingUser = null }) {
  const isEditMode = editingUser !== null

  // Initialize form data based on editingUser
  const getInitialFormData = () => {
    if (editingUser) {
      return {
        nome: editingUser.nome || '',
        email: editingUser.email || '',
        senha: '', // Don't pre-fill password for security
        funcao: editingUser.funcao || 'Consultor'
      }
    }
    return {
      nome: '',
      email: '',
      senha: '',
      funcao: 'Consultor'
    }
  }

  const [formData, setFormData] = useState(getInitialFormData)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.nome && formData.email && (isEditMode || formData.senha)) {
      const userData = {
        ...formData,
        id: isEditMode ? editingUser.id : undefined
      }
      onSave(userData, isEditMode)
      setFormData({
        nome: '',
        email: '',
        senha: '',
        funcao: 'Consultor'
      })
      onClose()
    }
  }

  const handleCancel = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      funcao: 'Consultor'
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Usuário' : 'Novo Usuário'}</h2>
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
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder={isEditMode ? 'Deixe em branco para manter a senha atual' : ''}
              required={!isEditMode}
            />
            {isEditMode && (
              <span className="form-hint">Deixe em branco para manter a senha atual</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="funcao">Função</label>
            <select
              id="funcao"
              name="funcao"
              value={formData.funcao}
              onChange={handleChange}
              required
            >
              <option value="Administrador">Administrador</option>
              <option value="Consultor">Consultor</option>
            </select>
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

export default NewUser

