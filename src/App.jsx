import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from "./components/Navbar/Navbar"
import Users from "./pages/Users/Users"
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/users" element={<Users />} />
            <Route path="/" element={<Users />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
