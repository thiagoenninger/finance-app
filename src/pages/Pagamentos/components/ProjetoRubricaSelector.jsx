import React from 'react'
import { formatCurrencyBRL } from '../../../utils/format'

const ProjetoRubricaSelector = React.memo(function ProjetoRubricaSelector({
  projetos,
  rubricasDisponiveis,
  saldoDisponivel,
  saldoError,
  projetoId,
  pronac,
  rubricaId,
  onProjetoChange,
  onRubricaChange,
}) {
  return (
    <>
      <div className="fields-row">
        <div className="form-field">
          <label htmlFor="projetoId">Projeto</label>
          {projetos.length === 0 ? (
            <div className="form-empty-warning">
              Não existem Projetos registrados no sistema
            </div>
          ) : (
            <select
              id="projetoId"
              name="projetoId"
              value={projetoId}
              onChange={onProjetoChange}
              required
            >
              <option value="">Selecione um projeto</option>
              {projetos.map((projeto) => (
                <option key={projeto.id} value={projeto.id}>
                  {projeto.nomeProjeto}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="pronac">PRONAC</label>
          <input
            type="text"
            id="pronac"
            name="pronac"
            value={pronac}
            readOnly
            className="readonly-input"
            placeholder="Será preenchido automaticamente"
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="rubricaId">Rubrica</label>
        {!projetoId ? (
          <div className="form-empty-neutral">
            Selecione um projeto primeiro
          </div>
        ) : rubricasDisponiveis.length === 0 ? (
          <div className="form-empty-warning">
            Este projeto não possui rubricas cadastradas
          </div>
        ) : (
          <>
            <select
              id="rubricaId"
              name="rubricaId"
              value={rubricaId}
              onChange={onRubricaChange}
              required
            >
              <option value="">Selecione uma rubrica</option>
              {rubricasDisponiveis.map((rubrica) => (
                <option key={rubrica.id} value={rubrica.id}>
                  {rubrica.produto} - {rubrica.etapa}
                </option>
              ))}
            </select>
            {rubricaId && saldoDisponivel !== null && (
              <div className="saldo-disponivel-box">
                <span className="saldo-label">Saldo disponível nesta rubrica:</span>
                <span className="saldo-value">{formatCurrencyBRL(saldoDisponivel)}</span>
              </div>
            )}
            {saldoError && <span className="form-error">{saldoError}</span>}
          </>
        )}
      </div>
    </>
  )
})

export default ProjetoRubricaSelector
