import { useState, useEffect } from 'react'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/firebase'

export function useCRUDList(collectionName, options = {}) {
  const { entityName = 'item' } = options

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      if (!db) throw new Error('Firebase não inicializado')
      const snapshot = await getDocs(collection(db, collectionName))
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      setError(`Erro ao carregar ${entityName}s: ${err.message}`)
      console.error(`Error fetching ${collectionName}:`, err)
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleEdit = (id) => {
    const item = items.find(i => i.id === id)
    if (item) {
      setEditingItem(item)
      setIsModalOpen(true)
    }
  }

  const handleDelete = (id, label) => {
    setItemToDelete({ id, label })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    try {
      setLoading(true)
      setError(null)
      await deleteDoc(doc(db, collectionName, itemToDelete.id))
      await fetchItems()
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (err) {
      setError(`Erro ao excluir ${entityName}: ${err.message}`)
      console.error(`Error deleting from ${collectionName}:`, err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false)
    setItemToDelete(null)
  }

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    items, setItems,
    loading, setLoading,
    error, setError,
    isModalOpen,
    isDeleteModalOpen, setIsDeleteModalOpen,
    itemToDelete, setItemToDelete,
    editingItem, setEditingItem,
    fetchItems,
    handleNew,
    handleCloseModal,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
  }
}
