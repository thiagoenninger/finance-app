import React from 'react'
import {Plus} from 'lucide-react'
import './style.css'

function Button({label, onClick, type = 'button'}) {
  return (
    <button type={type} className="app-button" onClick={onClick}>
      <Plus size={24} />
      <span>{label}</span>
    </button>
  )
}

export default Button