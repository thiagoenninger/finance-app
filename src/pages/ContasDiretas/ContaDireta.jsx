import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Download } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import './ContaDireta.css'

export default function ContaDireta() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [conta, setConta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [pdfError, setPdfError] = useState(false)

  useEffect(() => {
    fetchConta()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchConta = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!db) {
        throw new Error('Firebase não inicializado')
      }

      const contaRef = doc(db, 'contasDiretas', id)
      const contaSnap = await getDoc(contaRef)

      if (!contaSnap.exists()) {
        throw new Error('Conta direta não encontrada')
      }

      const contaData = {
        id: contaSnap.id,
        ...contaSnap.data()
      }

      setConta(contaData)
      // Reset PDF loading state when conta changes
      if (contaData.boletoUrl) {
        setPdfLoading(true)
        setPdfError(false)
      }
    } catch (err) {
      setError('Erro ao carregar conta direta: ' + err.message)
      console.error('Error fetching conta direta:', err)
    } finally {
      setLoading(false)
    }
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

  const handleDownloadBoleto = () => {
    if (conta.boletoUrl) {
      window.open(conta.boletoUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="conta-direta-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Carregando...
        </div>
      </div>
    )
  }

  if (error && !conta) {
    return (
      <div className="conta-direta-container">
        <div style={{
          padding: '1rem',
          margin: '1rem',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '8px',
        }}>
          {error}
          <button onClick={() => navigate('/contas-diretas')} style={{ marginLeft: '1rem' }}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="conta-direta-container">
      {error && (
        <div style={{
          padding: '1rem',
          margin: '1rem',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '8px',
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '1rem' }}>
            Fechar
          </button>
        </div>
      )}

      <div className="conta-direta-header">
        <div className="conta-direta-header-content">
          <h1>{conta?.nome || 'Conta Direta'}</h1>
          <button 
            className="conta-direta-back-button"
            onClick={() => navigate('/contas-diretas')}
            type="button"
            aria-label="Voltar para contas diretas"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>
        </div>
      </div>

      <div className="conta-direta-content">
        <div className="conta-direta-info-card">
          <h2>Informações da Conta</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Nome</label>
              <p>{conta?.nome || '-'}</p>
            </div>

            <div className="info-item">
              <label>Local</label>
              <p>{conta?.local || '-'}</p>
            </div>

            <div className="info-item">
              <label>Valor</label>
              <p className="info-value">{formatCurrency(conta?.valor)}</p>
            </div>

            <div className="info-item">
              <label>Data de Pagamento</label>
              <p>{formatDate(conta?.dataPagamento)}</p>
            </div>

            <div className="info-item">
              <label>Forma de Pagamento</label>
              <p>
                <span className={`pagamento-type pagamento-type-${conta?.formaPagamento?.toLowerCase()}`}>
                  {conta?.formaPagamento || '-'}
                </span>
              </p>
            </div>
          </div>

          {/* Informações específicas da forma de pagamento */}
          {conta?.formaPagamento === 'PIX' && conta?.chavePix && (
            <div className="payment-details">
              <h3>Detalhes do PIX</h3>
              <div className="info-item">
                <label>Chave PIX</label>
                <p>{conta.chavePix}</p>
              </div>
            </div>
          )}

          {conta?.formaPagamento === 'TED' && (
            <div className="payment-details">
              <h3>Detalhes do TED</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Banco</label>
                  <p>{conta?.banco || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Agência</label>
                  <p>{conta?.agencia || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Conta</label>
                  <p>{conta?.conta || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {conta?.observacao?.trim() && (
            <div className="payment-details observacao-details">
              <h3>Observação</h3>
              <p className="observacao-text">{conta.observacao}</p>
            </div>
          )}
        </div>

        {/* Preview do Boleto PDF */}
        {conta?.formaPagamento === 'Boleto' && conta?.boletoUrl && (
          <div className="boleto-preview-card">
            <div className="boleto-preview-header">
              <div className="boleto-preview-title">
                <FileText size={20} />
                <h2>Boleto Bancário</h2>
              </div>
              <button
                className="download-boleto-button"
                onClick={handleDownloadBoleto}
                type="button"
                aria-label="Baixar boleto"
              >
                <Download size={18} />
                <span>Baixar PDF</span>
              </button>
            </div>
            
            {conta.boletoFileName && (
              <p className="boleto-filename">{conta.boletoFileName}</p>
            )}

            <div className="boleto-preview-wrapper">
              {pdfLoading && (
                <div className="pdf-loading">
                  <p>Carregando PDF...</p>
                </div>
              )}
              {pdfError && (
                <div className="pdf-error">
                  <p>Erro ao carregar o PDF. Clique no botão "Baixar PDF" para abrir em uma nova aba.</p>
                </div>
              )}
              <iframe
                src={conta.boletoUrl}
                title="Preview do Boleto"
                className={`boleto-preview-iframe ${!pdfLoading ? 'loaded' : ''}`}
                type="application/pdf"
                onLoad={() => setPdfLoading(false)}
                onError={() => {
                  setPdfLoading(false)
                  setPdfError(true)
                }}
              />
            </div>
          </div>
        )}

        {conta?.formaPagamento === 'Boleto' && !conta?.boletoUrl && (
          <div className="boleto-preview-card">
            <div className="boleto-preview-header">
              <div className="boleto-preview-title">
                <FileText size={20} />
                <h2>Boleto Bancário</h2>
              </div>
            </div>
            <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
              Nenhum boleto anexado a esta conta.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
