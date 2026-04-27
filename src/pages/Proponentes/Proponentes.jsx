import React from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/Button/Button'
import DeleteConfirmation from '../../components/DeleteConfirmation/DeleteConfirmation'
import NewProponente from './NewProponente'
import './style.css'

import { collection, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { useCRUDList } from '../../hooks/useCRUDList'

function Proponentes() {
  const {
    items: proponentes,
    loading, setLoading,
    error, setError,
    isModalOpen,
    isDeleteModalOpen,
    itemToDelete: proponenteToDelete,
    editingItem: editingProponente,
    fetchItems: fetchProponentes,
    handleNew: handleNewProponente,
    handleCloseModal,
    handleEdit: handleEditProponente,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
  } = useCRUDList('proponentes', { entityName: 'proponente' })

  const handleDeleteProponente = (proponenteId) => {
    const proponente = proponentes.find(p => p.id === proponenteId)
    handleDelete(proponenteId, proponente?.nome || '')
  }

  const handleSaveProponente = async (proponenteData, isEditMode) => {
    try {
      setLoading(true)
      setError(null)

      if (isEditMode) {
        const proponenteRef = doc(db, 'proponentes', proponenteData.id)
        await updateDoc(proponenteRef, {
          nome: proponenteData.nome,
          tipoDocumento: proponenteData.tipoDocumento,
          documento: proponenteData.documento,
          updatedAt: new Date()
        })
      } else {
        await addDoc(collection(db, 'proponentes'), {
          nome: proponenteData.nome,
          tipoDocumento: proponenteData.tipoDocumento,
          documento: proponenteData.documento,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      await fetchProponentes()
      handleCloseModal()
    } catch (err) {
      setError('Erro ao salvar proponente: ' + err.message)
      console.error('Error saving proponente:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    {error && (
      <div style={{
        padding: '1rem',
        margin: '1rem',
        backgroundColor: '#fee',
        color: '#c00',
        borderRadius: '8px',
      }}>
        {error}
        <button onClick={() => setError(null)}
        style={{marginLeft: '1rem'}}>
          Fechar
        </button>
      </div>
    )}

    
      <div className="proponentes-container">
        {loading && (
        <div style={{ 
          padding: '1rem', 
          textAlign: 'center' 
        }}>
          Carregando...
        </div>
        )}
        {/* Header Section */}
        <div className="proponentes-header">
          <div className="proponentes-header-content">
            <div className="proponentes-header-text">
              <h1>Proponentes</h1>
              <p>Gerencie os proponentes do sistema</p>
            </div>
            <Button label="Novo Proponente" onClick={handleNewProponente} disabled={loading} />
          </div>
        </div>

        {/* Table Section */}
        <div className="proponentes-table-container">
          <table className="proponentes-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>CPF/CNPJ</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {proponentes.map((proponente) => (
                <tr key={proponente.id}>
                  <td>{proponente.nome}</td>
                  <td>
                    <span className="documento-type">
                      {proponente.tipoDocumento === 'CPF' ? 'CPF' : 'CNPJ'}
                    </span>
                  </td>
                  <td>
                    <span className="documento-value">{proponente.documento}</span>
                  </td>
                  <td>
                    <div className="actions-buttons">
                      <button 
                        className="action-button action-button-edit" 
                        onClick={() => handleEditProponente(proponente.id)}
                        type="button"
                        disabled={loading}
                        aria-label="Editar proponente"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        className="action-button action-button-delete" 
                        onClick={() => handleDeleteProponente(proponente.id)}
                        type="button"
                        aria-label="Excluir proponente"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewProponente 
        key={editingProponente?.id || 'new-proponente'}
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveProponente}
        editingProponente={editingProponente}
      />

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={proponenteToDelete?.label}
        itemType="proponente"
      />
    </>
  )
}

export default Proponentes

