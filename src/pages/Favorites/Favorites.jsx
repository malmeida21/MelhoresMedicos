import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { DoctorCard } from '../../components/DoctorCard/DoctorCard'
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { listarFavoritos } from '../../services/favoritos'
import { useAuth } from '../../contexts/AuthContext'
import styles from './Favorites.module.css'

export function Favorites() {
  const { user, loading: authLoading } = useAuth()
  const [favoritos, setFavoritos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listarFavoritos(user.id).then(data => {
      setFavoritos(data)
      setLoading(false)
    })
  }, [user])

  if (!authLoading && !user) return <Navigate to="/auth" />

  return (
    <div className="page">
      <div className="container">
        <h1 className={styles.title}><Heart size={20} /> Meus favoritos</h1>

        {loading ? (
          <LoadingSpinner fullPage />
        ) : favoritos.length === 0 ? (
          <EmptyState
            title="Nenhum favorito ainda"
            description="Acesse o perfil de um médico e clique em Favoritar."
          />
        ) : (
          <div className={styles.list}>
            {favoritos.map(m => (
              <DoctorCard key={m.id} medico={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
