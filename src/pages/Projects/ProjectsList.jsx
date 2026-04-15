import React, { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button'
import DeleteConfirmation from '../../components/DeleteConfirmation/DeleteConfirmation'
import NewProject from './NewProject'
import './style.css'

import {collection, getDocs, addDoc, updateDoc, deleteDoc, doc} from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { formatCurrencyBRL } from '../../utils/format'

export default function ProjectsList() {
  const navigate = useNavigate()
  const [projetos, setProjetos] = useState([])
  const [proponentes, setProponentes] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [projetoToDelete, setProjetoToDelete] = useState(null)
  const [editingProject, setEditingProject] = useState(null)

  const fetchProponentes = async () => {
    setLoading(true)
    try {
      if (!db) {
        throw new Error('Firebase não inicializado')
      }

      const proponentesCollection = collection(db, 'proponentes')
      const proponenteSnapshot = await getDocs(proponentesCollection)

      const proponentesList = proponenteSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))

      setProponentes(proponentesList)
    } catch (err) {
      console.error('Error fetching proponentes:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjetos = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!db) {
        throw new Error('Firebase não inicializado')
      }

      const projetosCollection = collection(db, 'projetos')
      const projetoSnapshot = await getDocs(projetosCollection)

      const projetosList = projetoSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))

      setProjetos(projetosList)
    } catch (err) {
      setError('Erro ao carregar projetos: ' + err.message)
      console.error('Error fetching projetos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewProject = () => {
    setEditingProject(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProject(null)
  }

  const handleSaveProject = async (projectData, isEditMode) => {
    try {
      setLoading(true)
      setError(null)

      const proponente = proponentes.find(p => p.id === projectData.proponenteId)
      const proponenteNome = proponente ? proponente.nome : ''

      const rubricas = projectData.rubricas || []
      const valorTotal = rubricas.reduce((sum, rubrica) => {
        const valor = Number(rubrica.valorAprovado) || 0
        return sum + valor
      }, 0)
      const valorTotalRounded = Math.round(valorTotal * 100) / 100

      if (isEditMode) {
        const projetoRef = doc(db, 'projetos', projectData.id)
        const updateData = {
          pronac: projectData.pronac,
          numeroConta: projectData.numeroConta,
          nomeProjeto: projectData.nomeProjeto,
          proponenteId: projectData.proponenteId,
          proponenteNome: proponenteNome,
          rubricas: rubricas,
          valorTotal: valorTotalRounded,
          updatedAt: new Date()
        }
        await updateDoc(projetoRef, updateData)
      } else {
        await addDoc(collection(db, 'projetos'), {
          pronac: projectData.pronac,
          numeroConta: projectData.numeroConta,
          nomeProjeto: projectData.nomeProjeto,
          proponenteId: projectData.proponenteId,
          proponenteNome: proponenteNome,
          rubricas: rubricas,
          valorTotal: valorTotalRounded,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      await fetchProjetos()

      setIsModalOpen(false)
      setEditingProject(null)
    } catch (err) {
      setError('Erro ao salvar projeto: ' + err.message)
      console.error('Error saving project:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProject = (projetoId) => {
    navigate(`/projetos/${projetoId}`)
  }

  const handleDeleteProject = (projetoId) => {
    const projeto = projetos.find(p => p.id === projetoId)
    setProjetoToDelete({ id: projetoId, nomeProjeto: projeto?.nomeProjeto || '' })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!projetoToDelete) return

    try {
      setLoading(true)
      setError(null)

      const projetoRef = doc(db, 'projetos', projetoToDelete.id)
      await deleteDoc(projetoRef)

      await fetchProjetos()

      setIsDeleteModalOpen(false)
      setProjetoToDelete(null)
    } catch (err) {
      setError('Erro ao excluir projeto: ' + err.message)
      console.error('Error deleting project:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false)
    setProjetoToDelete(null)
  }

  useEffect(() => {
    fetchProponentes()
    fetchProjetos()
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
        itemName={projetoToDelete?.nomeProjeto}
        itemType="projeto"
      />
    </>
  )
}
