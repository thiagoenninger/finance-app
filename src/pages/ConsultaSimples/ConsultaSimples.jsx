import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { formatCurrencyBRL } from '../../utils/format'
import './style.css'

export default function ConsultaSimples() {
  const [projetos, setProjetos] = useState([])
  const [loadingProjetos, setLoadingProjetos] = useState(true)
  const [error, setError] = useState('')

  const [projetoInput, setProjetoInput] = useState('')
  const [selectedProjeto, setSelectedProjeto] = useState(null)

  const [rubricaId, setRubricaId] = useState('')
  const [saldoDisponivel, setSaldoDisponivel] = useState(null)
  const [loadingSaldo, setLoadingSaldo] = useState(false)

  useEffect(() => {
    const fetchProjetos = async () => {
      setLoadingProjetos(true)
      setError('')
      try {
        const snap = await getDocs(collection(db, 'projetos'))
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setProjetos(list)
      } catch (err) {
        console.error('Erro ao carregar projetos:', err)
        setError('Não foi possível carregar os projetos.')
      } finally {
        setLoadingProjetos(false)
      }
    }

    fetchProjetos()
  }, [])

  const rubricasDisponiveis = useMemo(() => {
    if (!selectedProjeto?.rubricas) return []
    return selectedProjeto.rubricas.map((rubrica, index) => ({
      id: String(index),
      ...rubrica,
    }))
  }, [selectedProjeto])

  const selectedRubrica = useMemo(() => {
    if (!rubricaId) return null
    return rubricasDisponiveis.find((r) => r.id === rubricaId) || null
  }, [rubricaId, rubricasDisponiveis])

  const handleProjetoChange = (value) => {
    setProjetoInput(value)
    setRubricaId('')
    setSaldoDisponivel(null)

    const projeto = projetos.find(
      (p) => (p.nomeProjeto || '').toLowerCase() === value.trim().toLowerCase()
    )

    setSelectedProjeto(projeto || null)
  }

  const carregarSaldo = async (projetoId, rubricaIndex, valorAprovado) => {
    setLoadingSaldo(true)
    setError('')
    try {
      const pagamentosRef = collection(db, 'pagamentos')
      const q = query(pagamentosRef, where('projetoId', '==', projetoId), where('rubricaId', '==', String(rubricaIndex)))
      const snap = await getDocs(q)

      let totalPago = 0
      snap.forEach((docSnap) => {
        totalPago += Number(docSnap.data().valor) || 0
      })

      const saldo = (Number(valorAprovado) || 0) - totalPago
      setSaldoDisponivel(Math.round(saldo * 100) / 100)
    } catch (err) {
      console.error('Erro ao calcular saldo:', err)
      setError('Não foi possível calcular o saldo da rubrica.')
      setSaldoDisponivel(null)
    } finally {
      setLoadingSaldo(false)
    }
  }

  const handleRubricaChange = async (value) => {
    setRubricaId(value)
    setSaldoDisponivel(null)

    if (!selectedProjeto || !value) return

    const rubrica = rubricasDisponiveis.find((r) => r.id === value)
    if (!rubrica) return

    await carregarSaldo(selectedProjeto.id, value, rubrica.valorAprovado)
  }

  return (
    <div className="consulta-simples-container">
      <div className="consulta-simples-header">
        <h1>Consulta Simples</h1>
        <p>Consulte projetos e saldos de rubricas.</p>
      </div>

      {error && <div className="consulta-simples-error">{error}</div>}

      <div className="consulta-simples-card">
        <div className="consulta-simples-field">
          <label htmlFor="projeto">Projeto</label>
          <input
            id="projeto"
            type="text"
            list="projetos-list"
            placeholder={loadingProjetos ? 'Carregando projetos...' : 'Digite o nome do projeto'}
            value={projetoInput}
            onChange={(e) => handleProjetoChange(e.target.value)}
            disabled={loadingProjetos}
          />
          <datalist id="projetos-list">
            {projetos.map((projeto) => (
              <option key={projeto.id} value={projeto.nomeProjeto || ''} />
            ))}
          </datalist>
        </div>

        <div className="consulta-simples-field">
          <label htmlFor="rubrica">Rubrica</label>
          <select
            id="rubrica"
            value={rubricaId}
            onChange={(e) => handleRubricaChange(e.target.value)}
            disabled={!selectedProjeto}
          >
            <option value="">
              {!selectedProjeto ? 'Selecione um projeto válido primeiro' : 'Selecione uma rubrica'}
            </option>
            {rubricasDisponiveis.map((rubrica) => (
              <option key={rubrica.id} value={rubrica.id}>
                {rubrica.produto} - {rubrica.etapa}
              </option>
            ))}
          </select>
        </div>

        {selectedRubrica && (
          <div className="consulta-simples-results">
            <div className="consulta-simples-result-box">
              <span className="label">Valor Total</span>
              <strong>{formatCurrencyBRL(selectedRubrica.valorAprovado)}</strong>
            </div>

            <div className="consulta-simples-result-box">
              <span className="label">Saldo Disponível</span>
              <strong>
                {loadingSaldo
                  ? 'Calculando...'
                  : formatCurrencyBRL(saldoDisponivel ?? selectedRubrica.saldo ?? 0)}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}