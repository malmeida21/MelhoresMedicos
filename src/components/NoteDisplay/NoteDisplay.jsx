import { formatarNota, corNota, labelNota } from '../../utils/formatters'
import styles from './NoteDisplay.module.css'

export function NoteDisplay({ nota, size = 'md', showLabel = false }) {
  const color = nota != null ? corNota(nota) : 'var(--color-text-muted)'
  return (
    <div className={`${styles.wrap} ${styles[size]}`} style={{ '--note-color': color }}>
      <span className={styles.value}>{formatarNota(nota)}</span>
      {showLabel && nota != null && (
        <span className={styles.label}>{labelNota(nota)}</span>
      )}
    </div>
  )
}
