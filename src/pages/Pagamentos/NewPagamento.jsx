import { X, Calendar } from 'lucide-react'
import { useNewPagamento } from './useNewPagamento'
import ProjetoRubricaSelector from './components/ProjetoRubricaSelector'
import FileUploadField from './components/FileUploadField'
import './newPagamento.css'

function NewPagamento({ isOpen, onClose, onSave, editingPagamento = null }) {
  const {
    formData,
    projetos,
    fornecedores,
    rubricasDisponiveis,
    saldoDisponivel,
    uploading,
    notaFiscalError,
    saldoError,
    isEditMode,
    handleChange,
    handleFornecedorChange,
    handleProjetoChange,
    handleRubricaChange,
    handleValorChange,
    handleNotaFiscalFileChange,
    handleSubmit,
    handleCancel,
  } = useNewPagamento({ isOpen, onClose, onSave, editingPagamento })

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editar Pagamento' : 'Novo Pagamento'}</h2>
          <button
            className="modal-close-button"
            onClick={handleCancel}
            type="button"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <ProjetoRubricaSelector
            projetos={projetos}
            rubricasDisponiveis={rubricasDisponiveis}
            saldoDisponivel={saldoDisponivel}
            saldoError={saldoError}
            projetoId={formData.projetoId}
            pronac={formData.pronac}
            rubricaId={formData.rubricaId}
            onProjetoChange={handleProjetoChange}
            onRubricaChange={handleRubricaChange}
          />

          <div className="form-field">
            <label htmlFor="fornecedorId">Fornecedor</label>
            {fornecedores.length === 0 ? (
              <div className="form-empty-warning">
                Não existem Fornecedores registrados no sistema
              </div>
            ) : (
              <select
                id="fornecedorId"
                name="fornecedorId"
                value={formData.fornecedorId}
                onChange={handleFornecedorChange}
                required
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.razaoSocial}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="fields-row">
            <div className="form-field">
              <label htmlFor="numeroNF">Número da NF</label>
              <input
                type="text"
                id="numeroNF"
                name="numeroNF"
                value={formData.numeroNF}
                onChange={handleChange}
                required
                placeholder="Digite o número da NF"
              />
            </div>

            <div className="form-field">
              <label htmlFor="dataEmissaoNF">Data Emissão da NF</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="dataEmissaoNF"
                  name="dataEmissaoNF"
                  value={formData.dataEmissaoNF}
                  onChange={handleChange}
                  required
                />
                <Calendar size={18} className="calendar-icon" />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="valor">Valor R$</label>
              <input
                type="text"
                id="valor"
                name="valor"
                value={formData.valor}
                onChange={handleValorChange}
                required
                placeholder="0,00"
              />
            </div>
          </div>

          <FileUploadField
            id="notaFiscalFile"
            label="Anexar Nota Fiscal (PDF)"
            accept=".pdf"
            fileName={formData.notaFiscalFileName}
            error={notaFiscalError}
            hint={formData.notaFiscalFileName ? `✓ Arquivo selecionado: ${formData.notaFiscalFileName}` : ''}
            onChange={handleNotaFiscalFileChange}
          />

          <div className="form-field">
            <label htmlFor="dataPrevistaPagamento">Data Prevista de Pagamento</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                id="dataPrevistaPagamento"
                name="dataPrevistaPagamento"
                value={formData.dataPrevistaPagamento}
                onChange={handleChange}
                required
              />
              <Calendar size={18} className="calendar-icon" />
            </div>
          </div>

          {formData.tipoPagamento === 'Parcelado' ? (
            <div className="fields-row">
              <div className="form-field">
                <label htmlFor="tipoPagamento">Tipo de Pagamento</label>
                <select
                  id="tipoPagamento"
                  name="tipoPagamento"
                  value={formData.tipoPagamento}
                  onChange={handleChange}
                  required
                >
                  <option value="À Vista">À Vista</option>
                  <option value="Parcelado">Parcelado</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="numeroParcelas">Número de Parcelas</label>
                <select
                  id="numeroParcelas"
                  name="numeroParcelas"
                  value={formData.numeroParcelas}
                  onChange={handleChange}
                  required
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                    <option key={n} value={n}>{n}x</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="form-field">
              <label htmlFor="tipoPagamento">Tipo de Pagamento</label>
              <select
                id="tipoPagamento"
                name="tipoPagamento"
                value={formData.tipoPagamento}
                onChange={handleChange}
                required
              >
                <option value="À Vista">À Vista</option>
                <option value="Parcelado">Parcelado</option>
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button modal-button-cancel"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-button modal-button-submit"
              disabled={projetos.length === 0 || fornecedores.length === 0 || uploading || !!saldoError}
            >
              {uploading ? 'Salvando...' : (isEditMode ? 'Salvar' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewPagamento
