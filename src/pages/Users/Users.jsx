import React from 'react'
import './style.css'

function Users() {
  return (
    <div className="users-container">
      <div className="users-header">
        <div className="users-header-content">
          <div className="users-header-text">
            <h1>Usuários</h1>
            <p>Gerencie os usuários do sistema</p>
          </div>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Função</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem' }}>
                —
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Users
