import React, { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/Button/Button'
import NewUser from './NewUser'
import DeleteConfirmation from './DeleteConfirmation'
import './style.css'

import {collection, getDocs, addDoc, updateDoc, deleteDoc, doc} from 'firebase/firestore'
import { db } from '../../firebase/firebase'

function Users() {
  // Current logged-in user role - in a real app, this would come from auth context
  const currentUserRole = 'Administrador'

  const [users, setUsers] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [editingUser, setEditingUser] = useState(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!db) {
        throw new Error('Firebase não inicializado')
      }

      const usersCollection = collection(db, 'users')
      const userSnapshot = await getDocs(usersCollection)


      const usersList = []
      userSnapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          ...doc.data()
        })
      })

      setUsers(usersList)
    } catch (err) {
      setError('Erro ao carregar usuários: ' + err.message)
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewUser = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const handleSaveUser = async (userData, isEditMode) => {
    try {
      setLoading(true)
      setError(null)

      if (isEditMode) {
        //update existing user
        const userRef = doc(db, 'users', userData.id)
        await updateDoc(userRef, {
          nome: userData.nome,
          email: userData.email,
          funcao: userData.funcao,
          updatedAt: new Date()
        })
      } else {
        //create new user
        await addDoc(collection(db, 'users'), {
          nome: userData.nome,
          email: userData.email,
          funcao: userData.funcao,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      await fetchUsers()

      setIsModalOpen(false)
      setEditingUser(null)
    } catch (err) {
      setError('Erro ao salvar usuário: ' + err.message)
      console.error('Error saving user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (userId) => {
    // Only Administrador can edit users
    if (currentUserRole !== 'Administrador') {
      return
    }
    
    const user = users.find(u => u.id === userId)
    if (user) {
      setEditingUser(user)
      setIsModalOpen(true)
    }
  }

  const handleDeleteUser = (userId) => {
    // Only Administrador can delete users
    if (currentUserRole !== 'Administrador') {
      return
    }
    
    const user = users.find(u => u.id === userId)
    setUserToDelete({ id: userId, nome: user?.nome || '' })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    try {
      setLoading(true)
      setError(null)

      const userRef = doc(db, 'users', userToDelete.id)
      await deleteDoc(userRef)

      await fetchUsers()

      setIsDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (err) {
      setError('Erro ao excluir usuário: ' + err.message)
      console.error('Error deleting user:', err)
    } finally {
      setLoading(false)
    }
  }
    

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false)
    setUserToDelete(null)
  }

  const canDeleteUser = currentUserRole === 'Administrador'
  const canEditUser = currentUserRole === 'Administrador'

  useEffect(() => {
    fetchUsers()
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

    
      <div className="users-container">
        {loading && (
        <div style={{ 
          padding: '1rem', 
          textAlign: 'center' 
        }}>
          Carregando...
        </div>
        )}
        {/* Header Section */}
        <div className="users-header">
          <div className="users-header-content">
            <div className="users-header-text">
              <h1>Usuários</h1>
              <p>Gerencie os usuários do sistema</p>
            </div>
            <Button label="Novo Usuário" onClick={handleNewUser} disabled={loading} />
          </div>
        </div>

        {/* Table Section */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Função</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.nome}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.funcao === 'Administrador' ? 'role-badge-admin' : 'role-badge-consultor'}`}>
                      {user.funcao}
                    </span>
                  </td>
                  <td>
                    <div className="actions-buttons">
                      {canEditUser && (
                        <button 
                          className="action-button action-button-edit" 
                          onClick={() => handleEditUser(user.id)}
                          type="button"
                          disabled={loading}
                          aria-label="Editar usuário"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      {canDeleteUser && (
                        <button 
                          className="action-button action-button-delete" 
                          onClick={() => handleDeleteUser(user.id)}
                          type="button"
                          aria-label="Excluir usuário"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewUser 
        key={editingUser?.id || 'new-user'}
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveUser}
        editingUser={editingUser}
      />

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        userName={userToDelete?.nome}
      />
    </>
  )
}

export default Users

