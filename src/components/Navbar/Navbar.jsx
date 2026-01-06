import React from 'react'
import { NavLink } from 'react-router-dom'
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
  LayoutDashboard,
} from 'lucide-react'

const SidebarLinks = [
  {to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'},
  {to: '/users', icon: Users, label: 'Usuários'},
  {to: '/proponentes', icon: Building2, label: 'Proponentes'},
  {to: '/projetos', icon: FolderOpenDot, label: 'Projetos'},
  {to: '/fornecedores', icon: Truck, label: 'Fornecedores'},
  {to: '/pagamentos', icon: CreditCard, label: 'Pagamentos'},
  {to: '/contas-diretas', icon: Receipt, label: 'Contas Diretas'},
]

function Navbar() {
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
            <p>Admin</p>
          </div>
            <button className="navbar-link" type="button">
              <LogOut size={20}/>
              <span>Sair</span>
            </button>
        </div>
    </div>
  )
}

export default Navbar