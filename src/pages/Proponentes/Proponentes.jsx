import React, { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/Button/Button'
import DeleteConfirmation from '../../components/DeleteConfirmation/DeleteConfirmation'
import NewProponente from './NewProponente'
import './style.css'

import {collection, getDocs, addDoc, updateDoc, deleteDoc, doc} from 'firebase/firestore'
import { db } from '../../firebase/firebase'

function Proponentes() {
  const [proponentes, setProponentes] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [proponenteToDelete, setProponenteToDelete] = useState(null)
  const [editingProponente, setEditingProponente] = useState(null)

  const fetchProponentes = async () => {
    try {
      setLoading(true)
      setError(null)

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
      setError('Erro ao carregar proponentes: ' + err.message)
      console.error('Error fetching proponentes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewProponente = () => {
    setEditingProponente(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProponente(null)
  }

  const handleSaveProponente = async (proponenteData, isEditMode) => {
    try {
      setLoading(true)
      setError(null)

      if (isEditMode) {
        //update existing proponente
        const proponenteRef = doc(db, 'proponentes', proponenteData.id)
        await updateDoc(proponenteRef, {
          nome: proponenteData.nome,
          tipoDocumento: proponenteData.tipoDocumento,
          documento: proponenteData.documento,
          updatedAt: new Date()
        })
      } else {
        //create new proponente
        await addDoc(collection(db, 'proponentes'), {
          nome: proponenteData.nome,
          tipoDocumento: proponenteData.tipoDocumento,
          documento: proponenteData.documento,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      await fetchProponentes()

      setIsModalOpen(false)
      setEditingProponente(null)
    } catch (err) {
      setError('Erro ao salvar proponente: ' + err.message)
      console.error('Error saving proponente:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProponente = (proponenteId) => {
    const proponente = proponentes.find(p => p.id === proponenteId)
    if (proponente) {
      setEditingProponente(proponente)
      setIsModalOpen(true)
    }
  }

  const handleDeleteProponente = (proponenteId) => {
    const proponente = proponentes.find(p => p.id === proponenteId)
    setProponenteToDelete({ id: proponenteId, nome: proponente?.nome || '' })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!proponenteToDelete) return

    try {
      setLoading(true)
      setError(null)

      const proponenteRef = doc(db, 'proponentes', proponenteToDelete.id)
      await deleteDoc(proponenteRef)

      await fetchProponentes()

      setIsDeleteModalOpen(false)
      setProponenteToDelete(null)
    } catch (err) {
      setError('Erro ao excluir proponente: ' + err.message)
      console.error('Error deleting proponente:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false)
    setProponenteToDelete(null)
  }

  useEffect(() => {
    fetchProponentes()
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
        itemName={proponenteToDelete?.nome}
        itemType="proponente"
      />
    </>
  )
}

export default Proponentes

