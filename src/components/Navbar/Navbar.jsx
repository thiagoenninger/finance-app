import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import './style.css'

import {
  LogOut,
  Receipt,
  CreditCard,
  Truck,
  FolderOpenDot,
  Building2,
  Users,
  FolderKanban,
  FileText,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

const SidebarLinks = [
  {to: '/users', icon: Users, label: 'Usuários'},
  {to: '/proponentes', icon: Building2, label: 'Proponentes'},
  {to: '/fornecedores', icon: Truck, label: 'Fornecedores'},
  {to: '/projetos', icon: FolderOpenDot, label: 'Projetos'},
  {to: '/pagamentos', icon: CreditCard, label: 'Pagamentos'},
  {to: '/contas-diretas', icon: Receipt, label: 'Contas Diretas'},
  {to: '/relatorios', icon: FileText, label: 'Relatórios'},
]

function Navbar() {
  const {user, logout} = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', {replace: true})
  }

  const displayName = user?.displayName || user?.email || 'Usuário'

  return (
    <div className='navbar-container'>
        <div className="navbar-header">
            <div className="navbar-header-icon">
              <FolderKanban size={24}/>
            </div>
            <h1>GestPro</h1>
        </div>

        <div className="navbar-content">
            {SidebarLinks.map(({to, icon, label}) => (
              <NavLink 
                key={to} 
                to={to} 
                className={({ isActive }) => 
                  `navbar-link ${isActive ? 'navbar-link-active' : ''}`
                }
              >
                {React.createElement(icon, {size: 16})}
                <span>{label}</span>
              </NavLink>
            ))}
        </div>

        <div className="navbar-footer">
          <div className="navbar-footer-user">
            <p title={displayName}>{displayName}</p>
          </div>
            <button className="navbar-link" type="button" onClick={handleLogout}>
              <LogOut size={20}/>
              <span>Sair</span>
            </button>
        </div>
    </div>
  )
}

export default Navbar