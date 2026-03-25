import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from "./components/Navbar/Navbar"
import Users from "./pages/Users/Users"
import Proponentes from "./pages/Proponentes/Proponentes"
import Fornecedores from "./pages/Fornecedores/Fornecedores"
import ContasDiretas from "./pages/ContasDiretas/ContasDiretas"
import ContaDireta from "./pages/ContasDiretas/ContaDireta"
import Pagamentos from "./pages/Pagamentos/Pagamentos"
import Login from "./pages/Login/Login"

import './App.css'
import ProjectsList from './pages/Projects/ProjectsList'
import Project from './pages/Projects/Project'
import Relatorios from './pages/Relatorios/Relatorios'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/users" element={<Users />} />
            <Route path="/login" element={<Login />} />
            <Route path="/proponentes" element={<Proponentes />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/contas-diretas" element={<ContasDiretas />} />
            <Route path="/contas-diretas/:id" element={<ContaDireta />} />
            <Route path="/pagamentos" element={<Pagamentos />} />
            <Route path="/projetos" element={<ProjectsList/>}/>
            <Route path="/projetos/:id" element={<Project/>}/>
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/" element={<Users />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
