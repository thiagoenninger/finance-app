import React from 'react'
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
              <FolderKanban size={28}/>
            </div>
            <h1>GestPro</h1>
        </div>

        <div className="navbar-content">
            {SidebarLinks.map(({to, icon, label}) => (
              <button key={to} className="navbar-link" type="button">
                {React.createElement(icon, {size: 20})}
                <span>{label}</span>
              </button>
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