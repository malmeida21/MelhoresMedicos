import { useEffect, useState } from 'react'
import { adicionarFavorito, removerFavorito, verificarFavorito } from '../services/favoritos'
import { useAuth } from '../contexts/AuthContext'

export function useFavorite(medicoId) {
  const { user } = useAuth()
  const [favoritado, setFavoritado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (!user || !medicoId) return
    verificarFavorito(medicoId, user.id).then(setFavoritado)
  }, [medicoId, user])

  async function toggleFavorito() {
    if (!user) return false
    setCarregando(true)
    try {
      if (favoritado) {
        await removerFavorito(medicoId, user.id)
        setFavoritado(false)
      } else {
        await adicionarFavorito(medicoId, user.id)
        setFavoritado(true)
      }
      return true
    } finally {
      setCarregando(false)
    }
  }

  return { favoritado, toggleFavorito, carregando }
}
