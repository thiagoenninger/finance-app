import React, { useState, useEffect } from "react";
import { X, Upload, FileText } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { formatCurrencyBRL, parseValorBRL } from "../../utils/format";
import "./baixaNoPagamento.css";

function BaixaNoPagamento({ isOpen, onClose, onConfirm, pagamento }) {
  const [formData, setFormData] = useState({
    dataPagamento: "",
    valorPago: "",
    numeroComprovante: "",
    numeroPagamento: "",
    comprovanteFile: null,
    comprovanteFileName: "",
  });
  const [uploading, setUploading] = useState(false);
  const [comprovanteError, setComprovanteError] = useState("");

  useEffect(() => {
    if (isOpen && pagamento) {
      const valor = Number(pagamento.valor);
      const valorFormatado = Number.isNaN(valor)
        ? ""
        : valor.toFixed(2).replace(".", ",");
      setFormData({
        dataPagamento: "",
        valorPago: valorFormatado,
        numeroComprovante: "",
        numeroPagamento: "",
        comprovanteFile: null,
        comprovanteFileName: "",
      });
      setComprovanteError("");
    }
  }, [isOpen, pagamento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleValorPagoChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^\d,.-]/g, "");
    const hasComma = value.includes(",");
    const hasDot = value.includes(".");
    if (hasComma && hasDot) {
      const lastComma = value.lastIndexOf(",");
      const lastDot = value.lastIndexOf(".");
      value =
        lastComma > lastDot
          ? value.replace(/\./g, "")
          : value.replace(/,/g, "");
    }
    setFormData((prev) => ({ ...prev, valorPago: value }));
  };

  const handleComprovanteChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isPdf = file.type === 'application/pdf'
    const isPng = file.type === 'image/png'
    if (!isPdf && !isPng) {
      setComprovanteError('Aceito apenas arquivos .pdf ou .png')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setComprovanteError('O arquivo deve ter no máximo 5MB')
      return
    }
    setComprovanteError('')
    setFormData(prev => ({
      ...prev,
      comprovanteFile: file,
      comprovanteFileName: file.name
    }))
  }

  const uploadComprovanteToStorage = async (file, baixaId) => {
    const timestamp = Date.now();
    const fileName = `comprovantes-baixa/${baixaId}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pagamento || !db) return;

    const {
      dataPagamento,
      valorPago,
      numeroComprovante,
      numeroPagamento,
      comprovanteFile,
    } = formData;
    if (
      !dataPagamento ||
      !valorPago ||
      !numeroComprovante ||
      !numeroPagamento ||
      !comprovanteFile
    ) {
      return;
    }

    const valorNumerico = parseValorBRL(valorPago);
    const valorEsperado = Number(pagamento.valor);
    if (Math.abs(valorNumerico - valorEsperado) > 0.01) {
      return;
    }

    try {
      setUploading(true);
      setComprovanteError("");

      const baixaRef = await addDoc(collection(db, "baixasPagamento"), {
        pagamentoId: pagamento.id,
        dataPagamento,
        valorPago: valorNumerico,
        numeroComprovante: formData.numeroComprovante.trim(),
        numeroPagamento: formData.numeroPagamento.trim(),
        createdAt: serverTimestamp(),
      });
      const baixaId = baixaRef.id;

      let comprovanteUrl = "";
      if (comprovanteFile) {
        comprovanteUrl = await uploadComprovanteToStorage(
          comprovanteFile,
          baixaId,
        );
        await updateDoc(doc(db, "baixasPagamento", baixaId), {
          comprovanteUrl,
          comprovanteFileName: formData.comprovanteFileName,
          updatedAt: serverTimestamp(),
        });
      }

      const pagamentoRef = doc(db, "pagamentos", pagamento.id);
      await updateDoc(pagamentoRef, {
        pagamentoEmAberto: false,
        updatedAt: serverTimestamp(),
      });

      onConfirm();
      onClose();
    } catch (err) {
      console.error("Erro ao registrar baixa:", err);
      setComprovanteError("Erro ao salvar. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      dataPagamento: "",
      valorPago: "",
      numeroComprovante: "",
      numeroPagamento: "",
      comprovanteFile: null,
      comprovanteFileName: "",
    });
    setComprovanteError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div
        className="modal-content modal-content-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Baixa no Pagamento</h2>
          <button
            type="button"
            className="modal-close-button"
            onClick={handleCancel}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="baixa-dataPagamento">Data do Pagamento</label>
            <input
              type="date"
              id="baixa-dataPagamento"
              name="dataPagamento"
              value={formData.dataPagamento}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="baixa-valorPago">Valor Pago</label>
            <input
              type="text"
              id="baixa-valorPago"
              name="valorPago"
              value={formData.valorPago}
              onChange={handleValorPagoChange}
              required
              placeholder="0,00"
            />
            {pagamento && (
              <span className="form-hint">
                Valor do pagamento: {formatCurrencyBRL(pagamento.valor)}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="baixa-numeroComprovante">Nº Comprovante</label>
            <input
              type="text"
              id="baixa-numeroComprovante"
              name="numeroComprovante"
              value={formData.numeroComprovante}
              onChange={handleChange}
              required
              placeholder="Número do comprovante"
            />
          </div>

          <div className="form-field">
            <label htmlFor="baixa-numeroPagamento">Nº Pagamento</label>
            <input
              type="text"
              id="baixa-numeroPagamento"
              name="numeroPagamento"
              value={formData.numeroPagamento}
              onChange={handleChange}
              required
              placeholder="Número do pagamento"
            />
          </div>

          <div className="form-field">
            <label htmlFor="baixa-comprovante">
              <FileText
                size={18}
                style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
              />
              Anexar comprovante (PDF ou PNG)
            </label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="baixa-comprovante"
                accept=".pdf,.png"
                onChange={handleComprovanteChange}
                style={{ display: "none" }}
              />
              <label htmlFor="baixa-comprovante" className="file-input-label">
                <Upload size={18} />
                {formData.comprovanteFileName ||
                  "Selecionar arquivo PDF ou PNG"}
              </label>
            </div>
            {comprovanteError && (
              <span className="form-error">{comprovanteError}</span>
            )}
          </div>

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
              disabled={uploading}
            >
              {uploading ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BaixaNoPagamento;
