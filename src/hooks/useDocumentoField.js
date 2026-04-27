import { useState } from 'react'
import { isCpfValid, isCnpjValid } from '../utils/validation'
import { formatCPF, formatCNPJ } from '../utils/format'

export function useDocumentoField(formData, setFormData) {
  const [documentoError, setDocumentoError] = useState('')

  const handleDocumentoChange = (e) => {
    let value = e.target.value

    if (formData.tipoDocumento === 'CPF') {
      value = formatCPF(value)
    } else {
      value = formatCNPJ(value)
    }

    setFormData(prev => ({ ...prev, documento: value }))

    if (documentoError) {
      setDocumentoError('')
    }
  }

  const validateDocumentoFormat = (showErrorIfEmpty = false) => {
    if (!formData.documento) {
      if (showErrorIfEmpty) return false
      setDocumentoError('')
      return false
    }

    const cleaned = formData.documento.replace(/\D/g, '')

    if (formData.tipoDocumento === 'CPF') {
      if (cleaned.length !== 11) {
        setDocumentoError('CPF deve conter 11 dígitos')
        return false
      }
      if (!isCpfValid(formData.documento)) {
        setDocumentoError('CPF inválido. Verifique os dígitos.')
        return false
      }
    } else {
      if (cleaned.length !== 14) {
        setDocumentoError('CNPJ deve conter 14 dígitos')
        return false
      }
      if (!isCnpjValid(formData.documento)) {
        setDocumentoError('CNPJ inválido. Verifique os dígitos.')
        return false
      }
    }

    setDocumentoError('')
    return true
  }

  const handleTipoDocumentoChange = (e) => {
    const newTipo = e.target.value
    setFormData(prev => ({ ...prev, tipoDocumento: newTipo, documento: '' }))
    setDocumentoError('')
  }

  return {
    documentoError,
    setDocumentoError,
    handleDocumentoChange,
    validateDocumentoFormat,
    handleTipoDocumentoChange,
  }
}
