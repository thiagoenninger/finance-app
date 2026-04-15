import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Navbar from "./components/Navbar/Navbar"
import PrivateRoute from "./components/PrivateRoute/PrivateRoute"
import Users from "./pages/Users/Users"
import Proponentes from "./pages/Proponentes/Proponentes"
import Fornecedores from "./pages/Fornecedores/Fornecedores"
import ContasDiretas from "./pages/ContasDiretas/ContasDiretas"
import ContaDireta from "./pages/ContasDiretas/ContaDireta"
import Pagamentos from "./pages/Pagamentos/Pagamentos"
import Login from "./pages/Login/Login"
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
 
import './App.css'
import ProjectsList from './pages/Projects/ProjectsList'
import Project from './pages/Projects/Project'
import Relatorios from './pages/Relatorios/Relatorios'
import ConsultaSimples from './pages/ConsultaSimples/ConsultaSimples'
import CategoryRoute from './components/CategoryRoute/CategoryRoute'
import { CATEGORIA_SIMPLES, CATEGORIA_COMPLETO } from './constants/userCategories'
 
const ROUTES_WITHOUT_NAVBAR = ['/login']
 
function AppLayout() {
  const {loading, categoria, authError} = useAuth()
  const location = useLocation()
  const hideNavbar = ROUTES_WITHOUT_NAVBAR.includes(location.pathname)
 
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontSize: '0.95rem', color: '#6b7280',
      }}>
        Carregando...
      </div>
    )
  }
 
  return (
    <div className="app-container">
      {authError && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#fee2e2', color: '#991b1b',
          padding: '0.75rem 1.25rem', borderRadius: '8px',
          fontSize: '0.875rem', zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap'
        }}>
          {authError}
        </div>
      )}
      {!hideNavbar && <Navbar />}
      <main className={hideNavbar ? "app-main app-main--full" : "app-main"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/consulta-simples"
            element={
              <CategoryRoute allow={[CATEGORIA_SIMPLES]}>
                <ConsultaSimples />
              </CategoryRoute>
            }
          />
          <Route
            path="/users"
            element={
              <CategoryRoute allow={[CATEGORIA_COMPLETO]}>
                <Users />
              </CategoryRoute>
            }
          />
          <Route
            path="/proponentes"
            element={
              <CategoryRoute allow={[CATEGORIA_COMPLETO]}>
                <Proponentes />
              </CategoryRoute>
            }
          />
          <Route
            path="/fornecedores"
            element={
              <CategoryRoute allow={[CATEGORIA_COMPLETO]}>
                <Fornecedores />
              </CategoryRoute>
            }
          />
          <Route
            path="/contas-diretas"
            element={
              <CategoryRoute allow={[CATEGORIA_COMPLETO]}>
                <ContasDiretas />
              </CategoryRoute>
            }
          />
          <Route
            path="/contas-diretas/:id"
            element={
              <CategoryRoute allow={[CATEGORIA_COMPLETO]}>
                <ContaDireta />
              </CategoryRoute>
            }
          />
          <Route
            path="/pagamentos"
            element={
              <CategoryRoute allow={[CATEGORIA_COMPLETO]}>
                <Pagamentos />
              </CategoryRoute>
            }
          />
          <Route
            path="/projetos"
            element={
              <CategoryRoute allow={[CATEGORIA_COMPLETO]}>
                <ProjectsList />
              </CategoryRoute>
            }
          />
          <Route
            path="/projetos/:id"
            element={
              <CategoryRoute allow={[CATEGORIA_COMPLETO]}>
                <Project />
              </CategoryRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <CategoryRoute allow={[CATEGORIA_COMPLETO]}>
                <Relatorios />
              </CategoryRoute>
            }
          />
          <Route
            path="/"
            element={
              categoria === CATEGORIA_SIMPLES ? (
                <Navigate to="/consulta-simples" replace />
              ) : (
                <Navigate to="/projetos" replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}
 
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}
 
export default App