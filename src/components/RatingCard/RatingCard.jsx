import { useState } from 'react'
import { ThumbsUp, Flag, CheckCircle, XCircle } from 'lucide-react'
import { NoteDisplay } from '../NoteDisplay/NoteDisplay'
import { formatarData } from '../../utils/formatters'
import { curtirAvaliacao, descurtirAvaliacao, denunciarAvaliacao } from '../../services/avaliacoes'
import { useAuth } from '../../contexts/AuthContext'
import styles from './RatingCard.module.css'

export function RatingCard({ avaliacao, isMine = false, onEdit }) {
  const { user } = useAuth()
  const [curtidas, setCurtidas] = useState(avaliacao.curtidas ?? 0)
  const [curtido, setCurtido] = useState(false)
  const [denunciado, setDenunciado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCurtir() {
    if (!user || isMine || loading) return
    setLoading(true)
    try {
      if (curtido) {
        await descurtirAvaliacao(avaliacao.id, user.id)
        setCurtidas(c => c - 1)
        setCurtido(false)
      } else {
        await curtirAvaliacao(avaliacao.id, user.id)
        setCurtidas(c => c + 1)
        setCurtido(true)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDenunciar() {
    if (!user || denunciado || loading) return
    const motivo = prompt('Motivo da denúncia (opcional):')
    if (motivo === null) return
    setLoading(true)
    try {
      await denunciarAvaliacao(avaliacao.id, user.id, motivo)
      setDenunciado(true)
    } finally {
      setLoading(false)
    }
  }

  const autorLabel = avaliacao.autor?.email
    ? avaliacao.autor.email.split('@')[0]
    : 'Usuário'

  return (
    <div className={`${styles.card} ${isMine ? styles.mine : ''}`}>
      <div className={styles.top}>
        <div className={styles.autorInfo}>
          <span className={styles.autor}>{autorLabel}</span>
          <span className={styles.data}>{formatarData(avaliacao.criado_em)}</span>
        </div>
        <NoteDisplay nota={avaliacao.nota} size="sm" />
      </div>

      <div className={styles.recommend}>
        {avaliacao.recomendaria === true && (
          <span className={styles.yes}><CheckCircle size={13} /> Recomenda</span>
        )}
        {avaliacao.recomendaria === false && (
          <span className={styles.no}><XCircle size={13} /> Não recomenda</span>
        )}
      </div>

      {avaliacao.pontos_positivos && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Pontos positivos</p>
          <p className={styles.text}>{avaliacao.pontos_positivos}</p>
        </div>
      )}
      {avaliacao.pontos_negativos && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Pontos negativos</p>
          <p className={styles.text}>{avaliacao.pontos_negativos}</p>
        </div>
      )}

      <div className={styles.footer}>
        <button
          className={`btn btn-ghost ${curtido ? styles.curtidoBtn : ''}`}
          onClick={handleCurtir}
          disabled={!user || isMine || loading}
          title={isMine ? 'Você não pode curtir sua própria avaliação' : 'Útil'}
        >
          <ThumbsUp size={14} /> {curtidas > 0 && curtidas}
        </button>

        {isMine && (
          <button className="btn btn-outline" onClick={onEdit} style={{ fontSize: '.8rem', padding: '.3rem .75rem' }}>
            Editar
          </button>
        )}
        {!isMine && user && !denunciado && (
          <button className={`btn btn-ghost ${styles.flag}`} onClick={handleDenunciar} title="Denunciar">
            <Flag size={14} />
          </button>
        )}
        {denunciado && <span className={styles.denunciado}>Denunciado</span>}
      </div>
    </div>
  )
}
