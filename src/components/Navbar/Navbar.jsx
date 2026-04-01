import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './style.css'

import {
  LogOut, Receipt, CreditCard, Truck, FolderOpenDot,
  Building2, Users, FolderKanban, FileText, Search,
} from 'lucide-react'

import { useAuth } from '../../context/useAuth'
import { CATEGORIA_SIMPLES } from '../../constants/userCategories'

const COMPLETE_LINKS = [
  { to: '/users', icon: Users, label: 'Usuários' },
  { to: '/proponentes', icon: Building2, label: 'Proponentes' },
  { to: '/fornecedores', icon: Truck, label: 'Fornecedores' },
  { to: '/projetos', icon: FolderOpenDot, label: 'Projetos' },
  { to: '/pagamentos', icon: CreditCard, label: 'Pagamentos' },
  { to: '/contas-diretas', icon: Receipt, label: 'Contas Diretas' },
  { to: '/relatorios', icon: FileText, label: 'Relatórios' },
]

const SIMPLE_LINKS = [
  { to: '/consulta-simples', icon: Search, label: 'Consulta Simples' },
]

function Navbar() {
  const { user, perfil, categoria, logout } = useAuth()
  const navigate = useNavigate()

  const links = categoria === CATEGORIA_SIMPLES ? SIMPLE_LINKS : COMPLETE_LINKS
  const displayName = perfil?.nome?.trim() || user?.email?.split('@')[0] || 'Usuário'

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className='navbar-container'>
      <div className="navbar-header">
        <div className="navbar-header-icon">
          <FolderKanban size={24} />
        </div>
        <h1>GestPro</h1>
      </div>

      <div className="navbar-content">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `navbar-link ${isActive ? 'navbar-link-active' : ''}`}
          >
            {React.createElement(icon, { size: 16 })}
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="navbar-footer">
        <div className="navbar-footer-user">
          <p title={user?.email}>{displayName}</p>
        </div>
        <button className="navbar-link" type="button" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )
}

export default Navbar