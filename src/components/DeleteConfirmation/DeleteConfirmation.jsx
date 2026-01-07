import React from 'react'
import { X } from 'lucide-react'
import './style.css'

function DeleteConfirmation({ isOpen, onClose, onConfirm, itemName, itemType = 'item' }) {
  if (!isOpen) return null

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <h2>Confirmar Exclusão</h2>
          <button 
            className="delete-modal-close-button" 
            onClick={onClose}
            type="button"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="delete-modal-body">
          <p>Você quer realmente deletar o seguinte {itemType}?</p>
          {itemName && <p className="delete-modal-user-name">{itemName}</p>}
        </div>

        <div className="delete-modal-actions">
          <button 
            type="button" 
            className="delete-modal-button delete-modal-button-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="delete-modal-button delete-modal-button-confirm"
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmation

