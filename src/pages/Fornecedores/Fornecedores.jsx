import React, { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/Button/Button'
import DeleteConfirmation from '../../components/DeleteConfirmation/DeleteConfirmation'
import NewFornecedor from './NewFornecedor'
import './style.css'

import {collection, getDocs, addDoc, updateDoc, deleteDoc, doc} from 'firebase/firestore'
import { db } from '../../firebase/firebase'

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [fornecedorToDelete, setFornecedorToDelete] = useState(null)
  const [editingFornecedor, setEditingFornecedor] = useState(null)

  const fetchFornecedores = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!db) {
        throw new Error('Firebase não inicializado')
      }

      const fornecedoresCollection = collection(db, 'fornecedores')
      const fornecedorSnapshot = await getDocs(fornecedoresCollection)

      const fornecedoresList = []
      fornecedorSnapshot.forEach((doc) => {
        fornecedoresList.push({
          id: doc.id,
          ...doc.data()
        })
      })

      setFornecedores(fornecedoresList)
    } catch (err) {
      setError('Erro ao carregar fornecedores: ' + err.message)
      console.error('Error fetching fornecedores:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewFornecedor = () => {
    setEditingFornecedor(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingFornecedor(null)
  }

  const handleSaveFornecedor = async (fornecedorData, isEditMode) => {
    try {
      setLoading(true)
      setError(null)

      if (isEditMode) {
        //update existing fornecedor
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
        //create new fornecedor
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

      setIsModalOpen(false)
      setEditingFornecedor(null)
    } catch (err) {
      setError('Erro ao salvar fornecedor: ' + err.message)
      console.error('Error saving fornecedor:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditFornecedor = (fornecedorId) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId)
    if (fornecedor) {
      setEditingFornecedor(fornecedor)
      setIsModalOpen(true)
    }
  }

  const handleDeleteFornecedor = (fornecedorId) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId)
    setFornecedorToDelete({ id: fornecedorId, razaoSocial: fornecedor?.razaoSocial || '' })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!fornecedorToDelete) return

    try {
      setLoading(true)
      setError(null)

      const fornecedorRef = doc(db, 'fornecedores', fornecedorToDelete.id)
      await deleteDoc(fornecedorRef)

      await fetchFornecedores()

      setIsDeleteModalOpen(false)
      setFornecedorToDelete(null)
    } catch (err) {
      setError('Erro ao excluir fornecedor: ' + err.message)
      console.error('Error deleting fornecedor:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false)
    setFornecedorToDelete(null)
  }

  useEffect(() => {
    fetchFornecedores()
  }, [])

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
        itemName={fornecedorToDelete?.razaoSocial}
        itemType="fornecedor"
      />
    </>
  )
}

export default Fornecedores

