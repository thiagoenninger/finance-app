import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from "./components/Navbar/Navbar"
import Users from "./pages/Users/Users"
import Proponentes from "./pages/Proponentes/Proponentes"
import Fornecedores from "./pages/Fornecedores/Fornecedores"
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/users" element={<Users />} />
            <Route path="/proponentes" element={<Proponentes />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/" element={<Users />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
