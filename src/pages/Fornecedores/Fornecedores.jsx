import React from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/Button/Button'
import DeleteConfirmation from '../../components/DeleteConfirmation/DeleteConfirmation'
import NewFornecedor from './NewFornecedor'
import './style.css'

import { collection, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { useCRUDList } from '../../hooks/useCRUDList'

function Fornecedores() {
  const {
    items: fornecedores,
    loading, setLoading,
    error, setError,
    isModalOpen,
    isDeleteModalOpen,
    itemToDelete: fornecedorToDelete,
    editingItem: editingFornecedor,
    fetchItems: fetchFornecedores,
    handleNew: handleNewFornecedor,
    handleCloseModal,
    handleEdit: handleEditFornecedor,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
  } = useCRUDList('fornecedores', { entityName: 'fornecedor' })

  const handleDeleteFornecedor = (fornecedorId) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId)
    handleDelete(fornecedorId, fornecedor?.razaoSocial || '')
  }

  const handleSaveFornecedor = async (fornecedorData, isEditMode) => {
    try {
      setLoading(true)
      setError(null)

      if (isEditMode) {
        const fornecedorRef = doc(db, 'fornecedores', fornecedorData.id)
        await updateDoc(fornecedorRef, {
          razaoSocial: fornecedorData.razaoSocial,
          tipoDocumento: fornecedorData.tipoDocumento,
          documento: fornecedorData.documento,
          formaPagamento: fornecedorData.formaPagamento,
          chavePix: fornecedorData.chavePix || '',
          banco: fornecedorData.banco || '',
          agencia: fornecedorData.agencia || '',
          conta: fornecedorData.conta || '',
          updatedAt: new Date()
        })
      } else {
        await addDoc(collection(db, 'fornecedores'), {
          razaoSocial: fornecedorData.razaoSocial,
          tipoDocumento: fornecedorData.tipoDocumento,
          documento: fornecedorData.documento,
          formaPagamento: fornecedorData.formaPagamento,
          chavePix: fornecedorData.chavePix || '',
          banco: fornecedorData.banco || '',
          agencia: fornecedorData.agencia || '',
          conta: fornecedorData.conta || '',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      await fetchFornecedores()
      handleCloseModal()
    } catch (err) {
      setError('Erro ao salvar fornecedor: ' + err.message)
      console.error('Error saving fornecedor:', err)
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

    
      <div className="fornecedores-container">
        {loading && (
        <div style={{ 
          padding: '1rem', 
          textAlign: 'center' 
        }}>
          Carregando...
        </div>
        )}
        {/* Header Section */}
        <div className="fornecedores-header">
          <div className="fornecedores-header-content">
            <div className="fornecedores-header-text">
              <h1>Fornecedores</h1>
              <p>Gerencie os fornecedores do sistema</p>
            </div>
            <Button label="Novo Fornecedor" onClick={handleNewFornecedor} disabled={loading} />
          </div>
        </div>

        {/* Table Section */}
        <div className="fornecedores-table-container">
          <table className="fornecedores-table">
            <thead>
              <tr>
                <th>Razão Social</th>
                <th>Tipo</th>
                <th>CPF/CNPJ</th>
                <th>Forma de Pagamento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id}>
                  <td>{fornecedor.razaoSocial}</td>
                  <td>
                    <span className="documento-type">
                      {fornecedor.tipoDocumento === 'CPF' ? 'CPF' : 'CNPJ'}
                    </span>
                  </td>
                  <td>
                    <span className="documento-value">{fornecedor.documento}</span>
                  </td>
                  <td>
                    <span className={`pagamento-type pagamento-type-${fornecedor.formaPagamento === 'PIX' ? 'pix' : 'ted'}`}>
                      {fornecedor.formaPagamento}
                    </span>
                  </td>
                  <td>
                    <div className="actions-buttons">
                      <button 
                        className="action-button action-button-edit" 
                        onClick={() => handleEditFornecedor(fornecedor.id)}
                        type="button"
                        disabled={loading}
                        aria-label="Editar fornecedor"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        className="action-button action-button-delete" 
                        onClick={() => handleDeleteFornecedor(fornecedor.id)}
                        type="button"
                        aria-label="Excluir fornecedor"
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

      <NewFornecedor 
        key={editingFornecedor?.id || 'new-fornecedor'}
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveFornecedor}
        editingFornecedor={editingFornecedor}
      />

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={fornecedorToDelete?.label}
        itemType="fornecedor"
      />
    </>
  )
}

export default Fornecedores

