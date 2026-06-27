import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Header } from './components/Header/Header'
import { Home } from './pages/Home/Home'
import { DoctorProfile } from './pages/DoctorProfile/DoctorProfile'
import { Ranking } from './pages/Ranking/Ranking'
import { Search } from './pages/Search/Search'
import { Auth } from './pages/Auth/Auth'
import { Favorites } from './pages/Favorites/Favorites'
import { Importacao } from './pages/Importacao/Importacao'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/medico/:id"  element={<DoctorProfile />} />
          <Route path="/ranking"     element={<Ranking />} />
          <Route path="/busca"       element={<Search />} />
          <Route path="/auth"        element={<Auth />} />
          <Route path="/favoritos"   element={<Favorites />} />
          <Route path="/importar"    element={<Importacao />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
