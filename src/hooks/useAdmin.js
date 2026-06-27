import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { useAuth } from '../contexts/AuthContext'

export function useAdmin() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setIsAdmin(false); setLoading(false); return }

    supabase
      .from('perfis')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(data?.is_admin === true)
        setLoading(false)
      })
  }, [user, authLoading])

  return { isAdmin, loading }
}
