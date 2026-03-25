import React, { useEffect, useState, useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/Button/Button'
import DeleteConfirmation from '../../components/DeleteConfirmation/DeleteConfirmation'
import NewPagamento from './NewPagamento'
import BaixaNoPagamento from './BaixaNoPagamento'
import DateFilter from '../../components/DateFilter/DateFilter'
import './style.css'

import {collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc} from 'firebase/firestore'
import { db } from '../../firebase/firebase'

function Pagamentos() {
  const [pagamentos, setPagamentos] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pagamentoToDelete, setPagamentoToDelete] = useState(null)
  const [editingPagamento, setEditingPagamento] = useState(null)
  const [filterProjetoId, setFilterProjetoId] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterDateMode, setFilterDateMode] = useState('unica')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')
  const [isBaixaModalOpen, setIsBaixaModalOpen] = useState(false)
  const [pagamentoToBaixa, setPagamentoToBaixa] = useState(null)



  const getDataPrevistaAsString = (dataPrevistaPagamento) => {
    if (!dataPrevistaPagamento) return null
    const d = dataPrevistaPagamento
    if (typeof d === 'string' && d.includes('-')) return d
    if (d?.toDate?.()) return d.toDate().toISOString().slice(0,10)
    return new Date(d).toISOString().slice(0,10)
  }


  const projetosUnicos = useMemo(() => {
    const map = new Map()
    pagamentos.forEach((p) => {
      const projetoId = p.projetoId
      if (projetoId && !map.has(projetoId)) {
        map.set(projetoId, { id: projetoId, nome: p.projetoNome || 'Sem nome' })
      }
    })
    return Array.from(map.values()).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
  }, [pagamentos])

  const pagamentosFiltrados = useMemo(() => {
    let list = pagamentos
  
    if (filterProjetoId) {
      list = list.filter((p) => p.projetoId === filterProjetoId)
    }
  
    if (filterDateMode === 'unica' && filterDate) {
      list = list.filter((p) => {
        const dataStr = getDataPrevistaAsString(p.dataPrevistaPagamento)
        return dataStr === filterDate
      })
    }
  
    if (filterDateMode === 'periodo' && filterDateStart && filterDateEnd) {
      list = list.filter((p) => {
        const dataStr = getDataPrevistaAsString(p.dataPrevistaPagamento)
        if (!dataStr) return false
        return dataStr >= filterDateStart && dataStr <= filterDateEnd
      })
    }
  
    return list
  }, [pagamentos, filterProjetoId, filterDate, filterDateMode, filterDateStart, filterDateEnd])


  const fetchPagamentos = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!db) {
        throw new Error('Firebase não inicializado')
      }

      const pagamentosCollection = collection(db, 'pagamentos')
      const pagamentosSnapshot = await getDocs(pagamentosCollection)

      const pagamentosList = []
      pagamentosSnapshot.forEach((doc) => {
        pagamentosList.push({
          id: doc.id,
          ...doc.data()
        })
      })

      // Ordenar por data de pagamento (mais recente primeiro)
      pagamentosList.sort((a, b) => {
        const dateA = a.dataPrevistaPagamento ? new Date(a.dataPrevistaPagamento) : new Date(0)
        const dateB = b.dataPrevistaPagamento ? new Date(b.dataPrevistaPagamento) : new Date(0)
        return dateB - dateA
      })

      setPagamentos(pagamentosList)
    } catch (err) {
      setError('Erro ao carregar pagamentos: ' + err.message)
      console.error('Error fetching pagamentos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewPagamento = () => {
    setEditingPagamento(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPagamento(null)
  }

  const handleSavePagamento = async (pagamentoData, isEditMode) => {
    try {
      setLoading(true)
      setError(null)

      if (isEditMode) {
        const pagamentoRef = doc(db, 'pagamentos', pagamentoData.id)
        await updateDoc(pagamentoRef, {
          projetoId: pagamentoData.projetoId,
          projetoNome: pagamentoData.projetoNome,
          pronac: pagamentoData.pronac,
          rubricaId: pagamentoData.rubricaId,
          rubricaNome: pagamentoData.rubricaNome,
          fornecedorId: pagamentoData.fornecedorId,
          fornecedorNome: pagamentoData.fornecedorNome,
          numeroNF: pagamentoData.numeroNF,
          valor: pagamentoData.valor,
          notaFiscalUrl: pagamentoData.notaFiscalUrl || '',
          notaFiscalFileName: pagamentoData.notaFiscalFileName || '',
          dataPrevistaPagamento: pagamentoData.dataPrevistaPagamento,
          tipoPagamento: pagamentoData.tipoPagamento,
          numeroParcelas: pagamentoData.numeroParcelas || 1,
          updatedAt: new Date()
        })
      } else {
        await addDoc(collection(db, 'pagamentos'), {
          projetoId: pagamentoData.projetoId,
          projetoNome: pagamentoData.projetoNome,
          pronac: pagamentoData.pronac,
          rubricaId: pagamentoData.rubricaId,
          rubricaNome: pagamentoData.rubricaNome,
          fornecedorId: pagamentoData.fornecedorId,
          fornecedorNome: pagamentoData.fornecedorNome,
          numeroNF: pagamentoData.numeroNF,
          valor: pagamentoData.valor,
          notaFiscalUrl: pagamentoData.notaFiscalUrl || '',
          notaFiscalFileName: pagamentoData.notaFiscalFileName || '',
          dataPrevistaPagamento: pagamentoData.dataPrevistaPagamento,
          tipoPagamento: pagamentoData.tipoPagamento,
          numeroParcelas: pagamentoData.numeroParcelas || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          pagamentoEmAberto: true,
        })
      }
      await fetchPagamentos()

      setIsModalOpen(false)
      setEditingPagamento(null)
    } catch (err) {
      setError('Erro ao salvar pagamento: ' + err.message)
      console.error('Error saving pagamento:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPagamento = (pagamentoId) => {
    const pagamento = pagamentos.find(p => p.id === pagamentoId)
    if (pagamento) {
      setEditingPagamento(pagamento)
      setIsModalOpen(true)
    }
  }

  const handleDeletePagamento = (pagamentoId) => {
    const pagamento = pagamentos.find(p => p.id === pagamentoId)
    setPagamentoToDelete({ 
      id: pagamentoId, 
      identificacao: `${pagamento?.projetoNome || ''} - ${pagamento?.rubricaNome || ''}` 
    })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!pagamentoToDelete) return

    try {
      setLoading(true)
      setError(null)

      // Buscar o pagamento antes de deletar para atualizar o saldo
      const pagamentoRef = doc(db, 'pagamentos', pagamentoToDelete.id)
      const pagamentoSnap = await getDoc(pagamentoRef)
      
      if (pagamentoSnap.exists()) {
        const pagamentoData = pagamentoSnap.data()
        
        // Deletar o pagamento
        await deleteDoc(pagamentoRef)

        // Atualizar saldo da rubrica
        if (pagamentoData.projetoId && pagamentoData.rubricaId !== null && pagamentoData.rubricaId !== undefined) {
          await updateRubricaSaldoAfterDelete(pagamentoData.projetoId, pagamentoData.rubricaId)
        }
      } else {
        await deleteDoc(pagamentoRef)
      }

      await fetchPagamentos()

      setIsDeleteModalOpen(false)
      setPagamentoToDelete(null)
    } catch (err) {
      setError('Erro ao excluir pagamento: ' + err.message)
      console.error('Error deleting pagamento:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateRubricaSaldoAfterDelete = async (projetoId, rubricaId) => {
    try {
      if (!db || !projetoId || rubricaId === null || rubricaId === undefined) {
        return
      }

      const projetoRef = doc(db, 'projetos', projetoId)
      const projetoSnap = await getDoc(projetoRef)

      if (!projetoSnap.exists()) {
        return
      }

      const projetoData = projetoSnap.data()
      const rubricas = [...(projetoData.rubricas || [])]
      const rubricaIndex = parseInt(rubricaId)

      if (rubricas[rubricaIndex]) {
        const valorAprovado = Number(rubricas[rubricaIndex].valorAprovado) || 0
        
        // Buscar todos os pagamentos para esta rubrica (após deletar)
        const pagamentosCollection = collection(db, 'pagamentos')
        const pagamentosSnapshot = await getDocs(pagamentosCollection)

        let totalPago = 0
        pagamentosSnapshot.forEach((doc) => {
          const pagamento = doc.data()
          if (pagamento.projetoId === projetoId && pagamento.rubricaId === rubricaId) {
            totalPago += Number(pagamento.valor) || 0
          }
        })

        // Calcular e salvar o saldo
        const saldo = valorAprovado - totalPago
        rubricas[rubricaIndex] = {
          ...rubricas[rubricaIndex],
          saldo: Math.round(saldo * 100) / 100
        }

        // Atualizar o projeto
        await updateDoc(projetoRef, {
          rubricas: rubricas,
          updatedAt: new Date()
        })
      }
    } catch (err) {
      console.error('Error updating rubrica saldo after delete:', err)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false)
    setPagamentoToDelete(null)
  }

  const handleOpenBaixa = (pagamento) => {
    setPagamentoToBaixa(pagamento)
    setIsBaixaModalOpen(true)
  }

  const handleCloseBaixaModal = () => {
    setIsBaixaModalOpen(false)
    setPagamentoToBaixa(null)
  }

  const handleConfirmBaixa = async () => {
    await fetchPagamentos()
    handleCloseBaixaModal()
  }

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      if (typeof dateString === 'string' && dateString.includes('-')) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }
      const date = dateString instanceof Date ? dateString : new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  useEffect(() => {
    fetchPagamentos()
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

    
      <div className="pagamentos-container">
        {loading && (
        <div style={{ 
          padding: '1rem', 
          textAlign: 'center' 
        }}>
          Carregando...
        </div>
        )}
        {/* Header Section */}
        <div className="pagamentos-header">
          <div className="pagamentos-header-content">
            <div className="pagamentos-header-text">
              <h1>Pagamentos</h1>
              <p>Gerencie os pagamentos do sistema</p>
            </div>
            <Button label="Novo Pagamento" onClick={handleNewPagamento} disabled={loading} />
          </div>
        </div>

        {/* Filter Section */}
        <div className="pagamentos-filters">
          <div className="pagamentos-filters-row">
            <div className="pagamentos-filters-field">
              <select
                id="filter-projeto"
                value={filterProjetoId}
                onChange={(e) => setFilterProjetoId(e.target.value)}
              >
                <option value="">Todos os Projetos</option>
                {projetosUnicos.map((projeto) => (
                  <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>
                ))}
              </select>
            </div>

            <DateFilter
              idPrefix="pagamentos-"
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
              className="pagamentos-filter-clear"
              onClick={() => {
                setFilterProjetoId('')
                setFilterDate('')
                setFilterDateStart('')
                setFilterDateEnd('')
              }}
              disabled={!filterProjetoId && !filterDate && !(filterDateStart && filterDateEnd)}
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="pagamentos-table-container">
          <table className="pagamentos-table">
            <thead>
              <tr>
                <th>PRONAC</th>
                <th>Projeto</th>
                <th>Rubrica</th>
                <th>Valor R$</th>
                <th>Data Prevista Pagamento</th>
                <th>Tipo</th>
                <th>Situação</th>
                <th>Baixa no Pagamento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagamentosFiltrados.map((pagamento) => (
                <tr key={pagamento.id}>
                  <td>{pagamento.pronac}</td>
                  <td>{pagamento.projetoNome}</td>
                  <td>{pagamento.rubricaNome}</td>
                  <td>{formatCurrency(pagamento.valor)}</td>
                  <td>{formatDate(pagamento.dataPrevistaPagamento)}</td>
                  <td>
                    {pagamento.tipoPagamento === 'Parcelado' 
                      ? `${pagamento.tipoPagamento} (${pagamento.numeroParcelas}x)`
                      : pagamento.tipoPagamento
                    }
                  </td>
                  <td>
                    <span
                      className={`pagamentos-situacao-dot ${pagamento.pagamentoEmAberto !== false ? 'aberto' : 'pago'}`}
                      title={pagamento.pagamentoEmAberto !== false ? 'Em Aberto' : 'Pago'}
                      aria-hidden="true"
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {pagamento.pagamentoEmAberto !== false ? (
                      <button 
                        type="button"
                        className='pagamentos-baixa-btn'
                        onClick={() => handleOpenBaixa(pagamento)}
                        disabled={loading}
                      >
                        Baixa no Pagamento
                      </button>
                    ) : (
                      <span className='pagamentos-baixa-realizada'>Baixa realizada</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="actions-buttons">
                      <button 
                        className="action-button action-button-edit" 
                        onClick={() => handleEditPagamento(pagamento.id)}
                        type="button"
                        disabled={loading}
                        aria-label="Editar pagamento"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        className="action-button action-button-delete" 
                        onClick={() => handleDeletePagamento(pagamento.id)}
                        type="button"
                        disabled={loading}
                        aria-label="Excluir pagamento"
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

      <NewPagamento 
        key={editingPagamento?.id || 'new-pagamento'}
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSavePagamento}
        editingPagamento={editingPagamento}
      />

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={pagamentoToDelete?.identificacao}
        itemType="pagamento"
      />

      <BaixaNoPagamento
        isOpen={isBaixaModalOpen}
        onClose={handleCloseBaixaModal}
        onConfirm={handleConfirmBaixa}
        pagamento={pagamentoToBaixa}
      />
    </>
  )
}

export default Pagamentos
