import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/Button/Button'
import DeleteConfirmation from '../../components/DeleteConfirmation/DeleteConfirmation'
import NewContaDireta from './NewContaDireta'
import DateFilter from '../../components/DateFilter/DateFilter'
import './style.css'

import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { formatCurrencyBRL, formatDateBR, toDateInputString } from '../../utils/format'
import { useCRUDList } from '../../hooks/useCRUDList'

function ContasDiretas() {
  const navigate = useNavigate()

  const {
    items: contasDiretas,
    loading, setLoading,
    error, setError,
    isModalOpen,
    isDeleteModalOpen,
    itemToDelete: contaToDelete,
    editingItem: editingConta,
    fetchItems: fetchContasDiretas,
    handleNew: handleNewConta,
    handleCloseModal,
    handleEdit: handleEditConta,
    handleDelete,
    handleConfirmDelete,
    handleCancelDelete,
  } = useCRUDList('contasDiretas', { entityName: 'conta direta' })
  const [filterNome, setFilterNome] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterDateMode, setFilterDateMode] = useState('unica')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')
  const [sortField, setSortField] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  const contasDiretasFiltradas = useMemo(() => {
    let list = contasDiretas

    if (filterNome.trim()) {
      const termo = filterNome.trim().toLowerCase()
      list = list.filter((c) => (c.nome || '').toLowerCase().includes(termo))
    }

    if (filterDateMode === 'unica' && filterDate) {
      list = list.filter((c) => {
        const dataStr = toDateInputString(c.dataPagamento)
        return dataStr === filterDate
      })
    }

    if (filterDateMode === 'periodo' && filterDateStart && filterDateEnd) {
      list = list.filter((c) => {
        const dataStr = toDateInputString(c.dataPagamento)
        if (!dataStr) return false
        return dataStr >= filterDateStart && dataStr <= filterDateEnd
      })
    }

    const sorted = [...list]

    if (sortField === 'nome') {
      sorted.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }))
    } else if (sortField === 'local') {
      sorted.sort((a, b) => (a.local || '').localeCompare(b.local || '', 'pt-BR', { sensitivity: 'base' }))
    } else if (sortField === 'valor') {
      sorted.sort((a, b) => {
        const va = Number(a.valor) || 0
        const vb = Number(b.valor) || 0
        return va - vb
      })
    } else if (sortField === 'dataPagamento') {
      sorted.sort((a, b) => {
        const da = toDateInputString(a.dataPagamento)
        const db = toDateInputString(b.dataPagamento)
        if (!da && !db) return 0
        if (!da) return 1
        if (!db) return -1
        return da.localeCompare(db)
      })
    }

    return sorted
  }, [contasDiretas, filterNome, filterDate, filterDateMode, filterDateStart, filterDateEnd, sortField])

  const handleDeleteConta = (contaId) => {
    const conta = contasDiretas.find(c => c.id === contaId)
    handleDelete(contaId, conta?.nome || '')
  }

const addMonthsToDate = (dateInput, monthOffset) => {
    const d = dateInput
    let year, month, day
    if (typeof d === 'string' && d.includes('-')) {
      const [y, m, da] = d.split('-').map(Number)
      year = y
      month = m - 1
      day = da
    } else if (d?.toDate?.()) {
      const dt = d.toDate()
      year = dt.getFullYear()
      month = dt.getMonth()
      day = dt.getDate()
    } else {
      const dt = new Date(d)
      year = dt.getFullYear()
      month = dt.getMonth()
      day = dt.getDate()
    }
    const next = new Date(year, month + monthOffset, day)
    return next.toISOString().slice(0, 10)
  }

  const buildContaPayload = (contaData, dataPagamento) => ({
    nome: contaData.nome,
    local: contaData.local,
    valor: contaData.valor,
    dataPagamento,
    formaPagamento: contaData.formaPagamento,
    chavePix: contaData.chavePix || '',
    banco: contaData.banco || '',
    agencia: contaData.agencia || '',
    conta: contaData.conta || '',
    boletoUrl: contaData.boletoUrl || '',
    boletoFileName: contaData.boletoFileName || '',
    observacao: contaData.observacao || ''
  })

  const handleSaveConta = async (contaData, isEditMode, options = {}) => {
    try {
      setLoading(true)
      setError(null)

      if (isEditMode) {
        const contaRef = doc(db, 'contasDiretas', contaData.id)
        await updateDoc(contaRef, {
          ...buildContaPayload(contaData, contaData.dataPagamento),
          updatedAt: new Date()
        })
      } else {
        const recorrenteVezes = options.recorrenteVezes
        const isRecorrente = typeof recorrenteVezes === 'number' && recorrenteVezes >= 2 && recorrenteVezes <= 12

        if (isRecorrente) {
          for (let i = 0; i < recorrenteVezes; i++) {
            const dataPagamento = addMonthsToDate(contaData.dataPagamento, i)
            await addDoc(collection(db, 'contasDiretas'), {
              ...buildContaPayload(contaData, dataPagamento),
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        } else {
          await addDoc(collection(db, 'contasDiretas'), {
            ...buildContaPayload(contaData, contaData.dataPagamento),
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }
      await fetchContasDiretas()
      handleCloseModal()
    } catch (err) {
      setError('Erro ao salvar conta direta: ' + err.message)
      console.error('Error saving conta direta:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSelect = (contaId, e) => {
    e.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(contaId) ? prev.filter((id) => id !== contaId) : [...prev, contaId]
    )
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    setIsBulkDeleteModalOpen(true)
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      setLoading(true)
      setError(null)
      for (const id of selectedIds) {
        const contaRef = doc(db, 'contasDiretas', id)
        await deleteDoc(contaRef)
      }
      await fetchContasDiretas()
      setSelectedIds([])
      setIsBulkDeleteModalOpen(false)
    } catch (err) {
      setError('Erro ao excluir contas diretas: ' + err.message)
      console.error('Error bulk deleting contas diretas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBulkDelete = () => {
    setIsBulkDeleteModalOpen(false)
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

    
      <div className="contas-diretas-container">
        {loading && (
        <div style={{ 
          padding: '1rem', 
          textAlign: 'center' 
        }}>
          Carregando...
        </div>
        )}
        {/* Header Section */}
        <div className="contas-diretas-header">
          <div className="contas-diretas-header-content">
            <div className="contas-diretas-header-text">
              <h1>Contas Diretas</h1>
              <p>Gerencie as contas diretas do sistema</p>
            </div>
            <Button label="Nova Conta" onClick={handleNewConta} disabled={loading} />
          </div>
        </div>

        {/* Filter Section */}
        <div className="contas-diretas-filters">
          <div className="contas-diretas-filters-row">
            <div className="contas-diretas-filters-field">
              <label htmlFor="filter-nome">Nome</label>
              <input
                type="text"
                id="filter-nome"
                placeholder="Filtrar por nome..."
                value={filterNome}
                onChange={(e) => setFilterNome(e.target.value)}
              />
            </div>

            <DateFilter
              idPrefix="contas-diretas-"
              filterDateMode={filterDateMode}
              setFilterDateMode={setFilterDateMode}
              filterDate={filterDate}
              setFilterDate={setFilterDate}
              filterDateStart={filterDateStart}
              setFilterDateStart={setFilterDateStart}
              filterDateEnd={filterDateEnd}
              setFilterDateEnd={setFilterDateEnd}
            />

            <button
              type="button"
              className="contas-diretas-filter-clear"
              onClick={() => {
                setFilterNome('')
                setFilterDate('')
                setFilterDateStart('')
                setFilterDateEnd('')
              }}
              disabled={!filterNome.trim() && !filterDate && !(filterDateStart && filterDateEnd)}
            >
              Limpar Filtros
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                className="contas-diretas-bulk-delete-btn"
                onClick={handleBulkDelete}
                disabled={loading}
              >
                Excluir {selectedIds.length} selecionada(s)
              </button>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="contas-diretas-table-container">
          <table className="contas-diretas-table">
            <thead>
              <tr>
                <th onClick={() => setSortField('nome')}>Nome</th>
                <th onClick={() => setSortField('local')}>Local</th>
                <th onClick={() => setSortField('valor')}>Valor</th>
                <th onClick={() => setSortField('dataPagamento')}>Data de Pagamento</th>
                <th>Forma de Pagamento</th>
                <th>Ações</th>
                <th className="th-multiselect">Multiseleção</th>
              </tr>
            </thead>
            <tbody>
              {contasDiretasFiltradas.map((conta) => (
                <tr 
                  key={conta.id}
                  className="conta-row-clickable"
                  onClick={() => navigate(`/contas-diretas/${conta.id}`)}
                >
                  <td>{conta.nome}</td>
                  <td>{conta.local}</td>
                  <td>{formatCurrencyBRL(conta.valor)}</td>
                  <td>{formatDateBR(conta.dataPagamento)}</td>
                  <td>
                    <span className={`pagamento-type pagamento-type-${conta.formaPagamento?.toLowerCase()}`}>
                      {conta.formaPagamento}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="actions-buttons">
                      <button 
                        className="action-button action-button-edit" 
                        onClick={() => handleEditConta(conta.id)}
                        type="button"
                        disabled={loading}
                        aria-label="Editar conta"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        className="action-button action-button-delete" 
                        onClick={() => handleDeleteConta(conta.id)}
                        type="button"
                        disabled={loading}
                        aria-label="Excluir conta"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()} className="td-multiselect">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(conta.id)}
                      onChange={(e) => handleToggleSelect(conta.id, e)}
                      aria-label={`Selecionar ${conta.nome || 'conta'}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewContaDireta 
        key={editingConta?.id || 'new-conta'}
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveConta}
        editingConta={editingConta}
      />

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={contaToDelete?.label}
        itemType="conta direta"
      />

      <DeleteConfirmation
        isOpen={isBulkDeleteModalOpen}
        onClose={handleCancelBulkDelete}
        onConfirm={handleConfirmBulkDelete}
        itemName={selectedIds.length > 0 ? `${selectedIds.length} conta(s) direta(s) selecionada(s)` : ''}
        itemType="contas diretas"
      />
    </>
  )
}

export default ContasDiretas
