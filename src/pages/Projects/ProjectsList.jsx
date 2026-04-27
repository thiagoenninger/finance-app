import React, { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button'
import DeleteConfirmation from '../../components/DeleteConfirmation/DeleteConfirmation'
import NewProject from './NewProject'
import './style.css'

import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { formatCurrencyBRL, calculateRubricasTotal } from '../../utils/format'
import { useCRUDList } from '../../hooks/useCRUDList'

export default function ProjectsList() {
  const navigate = useNavigate()
  const [proponentes, setProponentes] = useState([])

  const {
    items: projetos,
    loading, setLoading,
    error, setError,
    isModalOpen,
    isDeleteModalOpen,
    itemToDelete: projetoToDelete,
    editingItem: editingProject,
    fetchItems: fetchProjetos,
    handleNew: handleNewProject,
    handleCloseModal,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
  } = useCRUDList('projetos', { entityName: 'projeto' })

  const fetchProponentes = async () => {
    try {
      if (!db) throw new Error('Firebase não inicializado')
      const snapshot = await getDocs(collection(db, 'proponentes'))
      setProponentes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Error fetching proponentes:', err)
    }
  }

  const handleEditProject = (projetoId) => {
    navigate(`/projetos/${projetoId}`)
  }

  const handleDeleteProject = (projetoId) => {
    const projeto = projetos.find(p => p.id === projetoId)
    handleDelete(projetoId, projeto?.nomeProjeto || '')
  }

  const handleSaveProject = async (projectData, isEditMode) => {
    try {
      setLoading(true)
      setError(null)

      const proponente = proponentes.find(p => p.id === projectData.proponenteId)
      const proponenteNome = proponente ? proponente.nome : ''
      const rubricas = projectData.rubricas || []
      const valorTotal = calculateRubricasTotal(rubricas)

      if (isEditMode) {
        await updateDoc(doc(db, 'projetos', projectData.id), {
          pronac: projectData.pronac,
          numeroConta: projectData.numeroConta,
          nomeProjeto: projectData.nomeProjeto,
          proponenteId: projectData.proponenteId,
          proponenteNome,
          rubricas,
          valorTotal,
          updatedAt: new Date()
        })
      } else {
        await addDoc(collection(db, 'projetos'), {
          pronac: projectData.pronac,
          numeroConta: projectData.numeroConta,
          nomeProjeto: projectData.nomeProjeto,
          proponenteId: projectData.proponenteId,
          proponenteNome,
          rubricas,
          valorTotal,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      await fetchProjetos()
      handleCloseModal()
    } catch (err) {
      setError('Erro ao salvar projeto: ' + err.message)
      console.error('Error saving project:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProponentes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    
      <div className="projetos-container">
        {loading && (
        <div style={{ 
          padding: '1rem', 
          textAlign: 'center' 
        }}>
          Carregando...
        </div>
        )}
        <div className="projetos-header">
          <div className="projetos-header-content">
            <div className="projetos-header-text">
              <h1>Projetos</h1>
              <p>Gerencie os projetos do sistema</p>
            </div>
            <Button label="Novo Projeto" onClick={handleNewProject} disabled={loading} />
          </div>
        </div>

        <div className="projetos-table-container">
          <table className="projetos-table">
            <thead>
              <tr>
                <th>PRONAC</th>
                <th>Nome do Projeto</th>
                <th>Proponente</th>
                <th>Valor Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {projetos.map((projeto) => (
                <tr key={projeto.id}>
                  <td>{projeto.pronac}</td>
                  <td>{projeto.nomeProjeto}</td>
                  <td>{projeto.proponenteNome || 'N/A'}</td>
                  <td>{formatCurrencyBRL(projeto.valorTotal)}</td>
                  <td>
                    <div className="actions-buttons">
                      <button 
                        className="action-button action-button-edit" 
                        onClick={() => handleEditProject(projeto.id)}
                        type="button"
                        disabled={loading}
                        aria-label="Editar projeto"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        className="action-button action-button-delete" 
                        onClick={() => handleDeleteProject(projeto.id)}
                        type="button"
                        disabled={loading}
                        aria-label="Excluir projeto"
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

      <NewProject
        key={editingProject?.id || 'new-project'}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProject}
        editingProject={editingProject}
        proponentes={proponentes}
      />

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={projetoToDelete?.label}
        itemType="projeto"
      />
    </>
  )
}
