import { useState } from 'react'
import { UserCircle } from 'lucide-react'
import { Modal } from '../Modal/Modal'
import { usePerfil } from '../../contexts/PerfilContext'
import styles from './NomeModal.module.css'

export function NomeModal() {
  const { precisaNome, salvarNome } = usePerfil()
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!valor.trim()) { setErro('Informe seu nome'); return }
    setLoading(true)
    try {
      await salvarNome(valor.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={precisaNome} title="Como podemos te chamar?" hideClose>
      <div className={styles.content}>
        <UserCircle size={40} className={styles.icon} />
        <p className={styles.desc}>
          Para avaliar médicos, precisamos saber seu nome. Ele aparecerá nas suas avaliações.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label htmlFor="nome-perfil">Seu nome</label>
            <input
              id="nome-perfil"
              type="text"
              className={`form-control ${erro ? 'error' : ''}`}
              placeholder="Nome completo"
              value={valor}
              onChange={e => { setValor(e.target.value); setErro('') }}
              autoFocus
            />
            {erro && <span className="error-msg">{erro}</span>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Salvando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </Modal>
  )
}
