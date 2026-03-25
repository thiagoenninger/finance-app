import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'

import Navbar from "./components/Navbar/Navbar"
import Users from "./pages/Users/Users"
import Proponentes from "./pages/Proponentes/Proponentes"
import Fornecedores from "./pages/Fornecedores/Fornecedores"
import ContasDiretas from "./pages/ContasDiretas/ContasDiretas"
import ContaDireta from "./pages/ContasDiretas/ContaDireta"
import Pagamentos from "./pages/Pagamentos/Pagamentos"
import Login from "./pages/Login/Login"
import ProjectsList from './pages/Projects/ProjectsList'
import Project from './pages/Projects/Project'
import Relatorios from './pages/Relatorios/Relatorios'

import './App.css'

import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute/PrivateRoute'

const ROUTES_WITHOUT_NAVBAR = ['/login']

function AppLayout() {
  const location = useLocation()
  const hideNavbar = ROUTES_WITHOUT_NAVBAR.includes(location.pathname)
  
  return (
      <div className="app-container">
      {!hideNavbar && <Navbar />}
      <main className={hideNavbar ? 'app-main app-main--full' : 'app-main'}>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />
 
          {/* Rotas protegidas */}
          <Route path="/users"           element={<PrivateRoute><Users /></PrivateRoute>} />
          <Route path="/proponentes"     element={<PrivateRoute><Proponentes /></PrivateRoute>} />
          <Route path="/fornecedores"    element={<PrivateRoute><Fornecedores /></PrivateRoute>} />
          <Route path="/contas-diretas"  element={<PrivateRoute><ContasDiretas /></PrivateRoute>} />
          <Route path="/contas-diretas/:id" element={<PrivateRoute><ContaDireta /></PrivateRoute>} />
          <Route path="/pagamentos"      element={<PrivateRoute><Pagamentos /></PrivateRoute>} />
          <Route path="/projetos"        element={<PrivateRoute><ProjectsList /></PrivateRoute>} />
          <Route path="/projetos/:id"    element={<PrivateRoute><Project /></PrivateRoute>} />
          <Route path="/relatorios"      element={<PrivateRoute><Relatorios /></PrivateRoute>} />
          <Route path="/"                element={<PrivateRoute><Users /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return(
    <BrowserRouter>
      <AuthProvider>
        <AppLayout/>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
