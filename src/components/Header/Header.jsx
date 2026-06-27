import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Stethoscope, Star, Search, Heart, LogOut, LogIn, Menu, X, PenLine, Upload } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../services/auth'
import { AvaliarModal } from '../AvaliarModal/AvaliarModal'
import styles from './Header.module.css'

export function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [avaliarOpen, setAvaliarOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function handleAvaliar() {
    setMenuOpen(false)
    if (!user) { navigate('/auth'); return }
    setAvaliarOpen(true)
  }

  const navLinks = [
    { to: '/',        label: 'Início',    icon: <Stethoscope size={16} /> },
    { to: '/ranking', label: 'Ranking',   icon: <Star size={16} /> },
    { to: '/busca',   label: 'Buscar',    icon: <Search size={16} /> },
    ...(user ? [
      { to: '/favoritos', label: 'Favoritos', icon: <Heart size={16} /> },
      { to: '/importar',  label: 'Importar',  icon: <Upload size={16} /> },
    ] : []),
  ]

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          <Link to="/" className={styles.logo}>
            <Stethoscope size={22} />
            <span>AvaliaMed</span>
          </Link>

          <nav className={`${styles.nav} ${menuOpen ? styles.open : ''}`}>
            {navLinks.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {icon}{label}
              </NavLink>
            ))}
            <button className={`btn ${styles.avaliarBtn} ${styles.avaliarMobile}`} onClick={handleAvaliar}>
              <PenLine size={15} /> Avaliar médico
            </button>
          </nav>

          <div className={styles.actions}>
            <button className={`btn btn-primary ${styles.avaliarDesktop}`} onClick={handleAvaliar}>
              <PenLine size={15} /> Avaliar médico
            </button>

            {user ? (
              <button className="btn btn-ghost" onClick={handleLogout} title="Sair">
                <LogOut size={16} /> <span className={styles.hideXs}>Sair</span>
              </button>
            ) : (
              <Link to="/auth" className="btn btn-outline">
                <LogIn size={16} /> Entrar
              </Link>
            )}

            <button
              className={`btn btn-ghost ${styles.burger}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <AvaliarModal open={avaliarOpen} onClose={() => setAvaliarOpen(false)} />
    </>
  )
}
