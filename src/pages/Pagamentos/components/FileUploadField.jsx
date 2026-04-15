import React from 'react'
import { Upload, FileText } from 'lucide-react'

function FileUploadField({ id, label, accept, fileName, error, hint, onChange }) {
  return (
    <div className="form-field">
      <label htmlFor={id}>
        <FileText size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        {label}
      </label>
      <div className="file-input-wrapper">
        <input
          type="file"
          id={id}
          accept={accept}
          onChange={onChange}
          style={{ display: 'none' }}
        />
        <label htmlFor={id} className="file-input-label">
          <Upload size={18} />
          {fileName || `Selecionar arquivo`}
        </label>
      </div>
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span className="form-hint" style={{ color: '#10b981' }}>{hint}</span>}
    </div>
  )
}

export default FileUploadField
