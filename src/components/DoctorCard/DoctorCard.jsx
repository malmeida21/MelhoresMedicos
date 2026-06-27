import { Link } from 'react-router-dom'
import { MapPin, Stethoscope, Star, ThumbsUp } from 'lucide-react'
import { NoteDisplay } from '../NoteDisplay/NoteDisplay'
import { formatarCRM, iniciais } from '../../utils/formatters'
import styles from './DoctorCard.module.css'

export function DoctorCard({ medico, rank }) {
  const pct = medico.total_avaliacoes > 0
    ? Math.round((medico.total_recomendam / medico.total_avaliacoes) * 100)
    : null

  return (
    <Link to={`/medico/${medico.id}`} className={styles.card}>
      {rank && <span className={styles.rank}>#{rank}</span>}

      <div className={styles.avatar}>
        <span>{iniciais(medico.nome)}</span>
      </div>

      <div className={styles.info}>
        <h3 className={styles.nome}>{medico.nome}</h3>
        <p className={styles.meta}>
          <Stethoscope size={13} /> {medico.especialidade}
        </p>
        {(medico.cidade || medico.estado) && (
          <p className={styles.meta}>
            <MapPin size={13} />
            {[medico.cidade, medico.estado].filter(Boolean).join(', ')}
          </p>
        )}
        <p className={styles.crm}>{formatarCRM(medico.crm, medico.uf_crm)}</p>
      </div>

      <div className={styles.stats}>
        <NoteDisplay nota={medico.nota_media > 0 ? medico.nota_media : null} size="md" />
        <p className={styles.avalCount}>
          <Star size={12} fill="currentColor" />
          {medico.total_avaliacoes} {medico.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'}
        </p>
        {pct !== null && (
          <p className={styles.recommend}>
            <ThumbsUp size={12} /> {pct}% recomendam
          </p>
        )}
      </div>
    </Link>
  )
}
