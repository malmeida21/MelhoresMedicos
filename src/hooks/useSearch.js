import { useEffect, useRef, useState } from 'react'
import { buscarMedicos } from '../services/medicos'

export function useSearch(delay = 300) {
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!termo.trim()) {
      setResultados([])
      return
    }

    setCarregando(true)
    timerRef.current = setTimeout(async () => {
      try {
        const dados = await buscarMedicos(termo)
        setResultados(dados)
        setErro(null)
      } catch (e) {
        setErro(e.message)
      } finally {
        setCarregando(false)
      }
    }, delay)

    return () => clearTimeout(timerRef.current)
  }, [termo, delay])

  return { termo, setTermo, resultados, carregando, erro }
}
