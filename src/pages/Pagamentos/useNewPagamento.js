import { useState, useEffect } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../firebase/firebase'
import { collection, getDocs, doc, getDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { parseValorBRL } from '../../utils/format'

const EMPTY_FORM = {
  projetoId: '',
  projetoNome: '',
  pronac: '',
  rubricaId: '',
  rubricaNome: '',
  fornecedorId: '',
  fornecedorNome: '',
  numeroNF: '',
  valor: '',
  notaFiscalFile: null,
  notaFiscalFileName: '',
  notaFiscalUrl: '',
  dataPrevistaPagamento: '',
  tipoPagamento: 'À Vista',
}

function buildInitialFormData(editingPagamento) {
  if (!editingPagamento) return { ...EMPTY_FORM }
  const data = {
    projetoId: editingPagamento.projetoId || '',
    projetoNome: editingPagamento.projetoNome || '',
    pronac: editingPagamento.pronac || '',
    rubricaId: editingPagamento.rubricaId || '',
    rubricaNome: editingPagamento.rubricaNome || '',
    fornecedorId: editingPagamento.fornecedorId || '',
    fornecedorNome: editingPagamento.fornecedorNome || '',
    numeroNF: editingPagamento.numeroNF || '',
    valor: editingPagamento.valor || '',
    notaFiscalFile: null,
    notaFiscalFileName: editingPagamento.notaFiscalFileName || '',
    notaFiscalUrl: editingPagamento.notaFiscalUrl || '',
    dataPrevistaPagamento: editingPagamento.dataPrevistaPagamento || '',
    tipoPagamento: editingPagamento.tipoPagamento || 'À Vista',
  }
  if (data.tipoPagamento === 'Parcelado') {
    data.numeroParcelas = editingPagamento.numeroParcelas || 1
  }
  return data
}

export function useNewPagamento({ isOpen, onClose, onSave, editingPagamento }) {
  const isEditMode = editingPagamento !== null

  const [projetos, setProjetos] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [rubricasDisponiveis, setRubricasDisponiveis] = useState([])
  const [saldoDisponivel, setSaldoDisponivel] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState(() => buildInitialFormData(editingPagamento))
  const [notaFiscalError, setNotaFiscalError] = useState('')
  const [saldoError, setSaldoError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    fetchProjetos()
    fetchFornecedores()
    if (editingPagamento) {
      const initialData = buildInitialFormData(editingPagamento)
      setFormData(initialData)
      if (editingPagamento.projetoId) {
        loadRubricasFromProject(editingPagamento.projetoId).then(() => {
          if (editingPagamento.rubricaId) {
            calculateSaldoDisponivel(editingPagamento.projetoId, editingPagamento.rubricaId)
          }
        })
      }
    } else {
      setFormData({ ...EMPTY_FORM })
      setRubricasDisponiveis([])
      setSaldoDisponivel(null)
    }
    setNotaFiscalError('')
    setSaldoError('')
    // Intencionalmente usa editingPagamento?.id (não o objeto inteiro) como dependência.
    // O formulário só deve ser reiniciado quando um novo pagamento é aberto para edição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPagamento?.id, isOpen])

  // --- Fetchers ---

  const fetchProjetos = async () => {
    try {
      if (!db) return
      const snapshot = await getDocs(collection(db, 'projetos'))
      setProjetos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Error fetching projetos:', err)
    }
  }

  const fetchFornecedores = async () => {
    try {
      if (!db) return
      const snapshot = await getDocs(collection(db, 'fornecedores'))
      setFornecedores(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Error fetching fornecedores:', err)
    }
  }

  const loadRubricasFromProject = async (projetoId) => {
    try {
      if (!db || !projetoId) { setRubricasDisponiveis([]); return }
      const projetoSnap = await getDoc(doc(db, 'projetos', projetoId))
      if (!projetoSnap.exists()) { setRubricasDisponiveis([]); return }
      const rubricas = projetoSnap.data().rubricas || []
      setRubricasDisponiveis(rubricas.map((r, i) => ({ id: i.toString(), ...r })))
      setSaldoDisponivel(null)
    } catch (err) {
      console.error('Error loading rubricas:', err)
      setRubricasDisponiveis([])
    }
  }

  // --- Helpers ---

  const fetchTotalPago = async (projetoId, rubricaId, excludeId = null) => {
    const snapshot = await getDocs(
      query(
        collection(db, 'pagamentos'),
        where('projetoId', '==', projetoId),
        where('rubricaId', '==', String(rubricaId))
      )
    )
    let total = 0
    snapshot.forEach((d) => {
      if (!excludeId || d.id !== excludeId) {
        total += Number(d.data().valor) || 0
      }
    })
    return total
  }

  // --- Cálculo de saldo ---

  const calculateSaldoDisponivel = async (projetoId, rubricaIndex) => {
    try {
      if (!db || !projetoId || rubricaIndex === null || rubricaIndex === undefined) {
        setSaldoDisponivel(null)
        return
      }
      const projetoSnap = await getDoc(doc(db, 'projetos', projetoId))
      if (!projetoSnap.exists()) { setSaldoDisponivel(null); return }

      const rubricas = projetoSnap.data().rubricas || []
      const rubrica = rubricas[parseInt(rubricaIndex)]
      if (!rubrica) { setSaldoDisponivel(null); return }

      const totalPago = await fetchTotalPago(
        projetoId,
        rubricaIndex.toString(),
        isEditMode ? editingPagamento?.id : null
      )

      setSaldoDisponivel((Number(rubrica.valorAprovado) || 0) - totalPago)
    } catch (err) {
      console.error('Error calculating saldo:', err)
      setSaldoDisponivel(null)
    }
  }

  // --- Atualização de saldo no Firestore ---

  const updateRubricaSaldo = async (projetoId, rubricaId) => {
    try {
      if (!db || !projetoId || rubricaId === null || rubricaId === undefined) return
      const projetoRef = doc(db, 'projetos', projetoId)
      const projetoSnap = await getDoc(projetoRef)
      if (!projetoSnap.exists()) return

      const rubricas = [...(projetoSnap.data().rubricas || [])]
      const rubricaIndex = parseInt(rubricaId)
      if (!rubricas[rubricaIndex]) return

      const valorAprovado = Number(rubricas[rubricaIndex].valorAprovado) || 0
      const totalPago = await fetchTotalPago(projetoId, String(rubricaId))

      rubricas[rubricaIndex] = {
        ...rubricas[rubricaIndex],
        saldo: Math.round((valorAprovado - totalPago) * 100) / 100,
      }
      await updateDoc(projetoRef, { rubricas, updatedAt: serverTimestamp() })
    } catch (err) {
      console.error('Error updating rubrica saldo:', err)
      throw err
    }
  }

  // --- Upload ---

  const uploadNotaFiscalToStorage = async (file, pagamentoId = null) => {
    try {
      const timestamp = Date.now()
      const fileName = pagamentoId
        ? `notas-fiscais/${pagamentoId}_${timestamp}_${file.name}`
        : `notas-fiscais/temp_${timestamp}_${file.name}`
      const snapshot = await uploadBytes(ref(storage, fileName), file)
      return getDownloadURL(snapshot.ref)
    } catch (error) {
      console.error('Erro ao fazer upload da nota fiscal:', error)
      throw new Error('Erro ao fazer upload da nota fiscal: ' + error.message)
    }
  }

  // --- Handlers de formulário ---

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'tipoPagamento' && value === 'À Vista') delete next.numeroParcelas
      if (name === 'tipoPagamento' && value === 'Parcelado' && !next.numeroParcelas) next.numeroParcelas = 1
      return next
    })
  }

  const handleFornecedorChange = (e) => {
    const fornecedor = fornecedores.find((f) => f.id === e.target.value)
    setFormData((prev) => ({
      ...prev,
      fornecedorId: fornecedor?.id || '',
      fornecedorNome: fornecedor?.razaoSocial || '',
    }))
  }

  const handleProjetoChange = async (e) => {
    const projeto = projetos.find((p) => p.id === e.target.value)
    if (projeto) {
      setFormData((prev) => ({
        ...prev,
        projetoId: projeto.id,
        projetoNome: projeto.nomeProjeto,
        pronac: projeto.pronac,
        rubricaId: '',
        rubricaNome: '',
      }))
      await loadRubricasFromProject(projeto.id)
      setSaldoDisponivel(null)
    } else {
      setFormData((prev) => ({ ...prev, projetoId: '', projetoNome: '', pronac: '', rubricaId: '', rubricaNome: '' }))
      setRubricasDisponiveis([])
      setSaldoDisponivel(null)
    }
  }

  const handleRubricaChange = async (e) => {
    const rubrica = rubricasDisponiveis.find((r) => r.id === e.target.value)
    if (rubrica) {
      setFormData((prev) => ({
        ...prev,
        rubricaId: rubrica.id,
        rubricaNome: `${rubrica.produto} - ${rubrica.etapa}`,
      }))
      await calculateSaldoDisponivel(formData.projetoId, rubrica.id)
    } else {
      setFormData((prev) => ({ ...prev, rubricaId: '', rubricaNome: '' }))
      setSaldoDisponivel(null)
    }
  }

  const handleValorChange = (e) => {
    let value = e.target.value
    value = value.replace(/[^\d,.-]/g, '')
    const hasComma = value.includes(',')
    const hasDot = value.includes('.')
    if (hasComma && hasDot) {
      const lastComma = value.lastIndexOf(',')
      const lastDot = value.lastIndexOf('.')
      value = lastComma > lastDot ? value.replace(/\./g, '') : value.replace(/,/g, '')
    }
    setFormData((prev) => ({ ...prev, valor: value }))
    if (saldoDisponivel !== null && value) {
      const valorNumerico = parseValorBRL(value)
      setSaldoError(valorNumerico > saldoDisponivel ? 'A rubrica não tem saldo suficiente para este valor.' : '')
    }
  }

  const handleNotaFiscalFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setNotaFiscalError('Por favor, selecione um arquivo PDF')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotaFiscalError('O arquivo deve ter no máximo 5MB')
      return
    }
    setNotaFiscalError('')
    setFormData((prev) => ({ ...prev, notaFiscalFile: file, notaFiscalFileName: file.name, notaFiscalUrl: '' }))
  }

  // --- Submit e Cancel ---

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM })
    setRubricasDisponiveis([])
    setSaldoDisponivel(null)
    setNotaFiscalError('')
    setSaldoError('')
  }

  const handleCancel = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.projetoId || !formData.rubricaId || !formData.fornecedorId ||
        !formData.numeroNF || !formData.valor || !formData.dataPrevistaPagamento ||
        !formData.tipoPagamento) return

    if (formData.tipoPagamento === 'Parcelado' &&
        (!formData.numeroParcelas || formData.numeroParcelas < 1 || formData.numeroParcelas > 12)) return

    const valorNumerico = parseValorBRL(formData.valor)
    if (valorNumerico <= 0) return

    if (saldoDisponivel !== null && valorNumerico > saldoDisponivel) {
      setSaldoError('A rubrica não tem saldo suficiente para este valor.')
      return
    }

    try {
      setUploading(true)
      setSaldoError('')
      let notaFiscalUrl = formData.notaFiscalUrl

      if (formData.notaFiscalFile) {
        try {
          notaFiscalUrl = await uploadNotaFiscalToStorage(
            formData.notaFiscalFile,
            isEditMode ? editingPagamento.id : null
          )
        } catch (uploadError) {
          console.error('Erro ao fazer upload da nota fiscal:', uploadError)
          setNotaFiscalError('Erro ao fazer upload da nota fiscal. Tente novamente.')
          return
        }
      }

      const pagamentoData = {
        ...formData,
        valor: valorNumerico,
        notaFiscalUrl,
        id: isEditMode ? editingPagamento.id : undefined,
      }
      if (pagamentoData.tipoPagamento === 'À Vista') delete pagamentoData.numeroParcelas

      await onSave(pagamentoData, isEditMode)
      await updateRubricaSaldo(formData.projetoId, formData.rubricaId)

      resetForm()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error)
      setNotaFiscalError('Erro ao salvar pagamento. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  return {
    // estado
    formData,
    projetos,
    fornecedores,
    rubricasDisponiveis,
    saldoDisponivel,
    uploading,
    notaFiscalError,
    saldoError,
    isEditMode,
    // handlers
    handleChange,
    handleFornecedorChange,
    handleProjetoChange,
    handleRubricaChange,
    handleValorChange,
    handleNotaFiscalFileChange,
    handleSubmit,
    handleCancel,
  }
}
