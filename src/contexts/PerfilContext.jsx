import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../supabase/client'

const PerfilContext = createContext(null)
const CACHE_KEY = 'avaliamed_nome'

function lerCache() {
  try { return localStorage.getItem(CACHE_KEY) || null } catch { return null }
}

function salvarCache(nome) {
  try { localStorage.setItem(CACHE_KEY, nome) } catch { /* ignore */ }
}

function limparCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}

/** @param {{ children: React.ReactNode }} props */
export function PerfilProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  // inicia com o cache para não piscar o modal em recargas
  const [nome, setNome] = useState(lerCache)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      limparCache()
      setNome(null)
      setLoading(false)
      return
    }

    // se já tem cache, libera o loading imediatamente (sem piscar modal)
    if (lerCache()) { setLoading(false) }

    async function carregarPerfil() {
      const { data } = await supabase
        .from('perfis').select('nome').eq('id', user.id).maybeSingle()

      if (data?.nome) {
        salvarCache(data.nome)
        setNome(data.nome)
      } else {
        // Google OAuth fornece nome — tenta salvar no banco
        const nomeGoogle = user.user_metadata?.full_name || user.user_metadata?.name
        if (nomeGoogle) {
          const { error } = await supabase
            .from('perfis').upsert({ id: user.id, nome: nomeGoogle })
          if (!error) {
            salvarCache(nomeGoogle)
            setNome(nomeGoogle)
          } else if (!lerCache()) {
            // banco falhou e não tem cache: pede o nome
            setNome('')
          }
        } else if (!lerCache()) {
          // email sem nome e sem cache: pede o nome
          setNome('')
        }
      }
      setLoading(false)
    }

    carregarPerfil()
  }, [user, authLoading])

  async function salvarNome(novoNome) {
    // salva cache antes de qualquer resposta do banco
    salvarCache(novoNome)
    setNome(novoNome)
    await supabase.from('perfis').upsert({ id: user.id, nome: novoNome })
  }

  const value = useMemo(
    () => ({ nome, loading, precisaNome: !loading && !!user && nome === '', salvarNome }),
    [nome, loading, user] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <PerfilContext.Provider value={value}>
      {children}
    </PerfilContext.Provider>
  )
}

export function usePerfil() {
  return useContext(PerfilContext)
}
