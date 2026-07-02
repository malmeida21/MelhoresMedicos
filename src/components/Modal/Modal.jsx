import { useEffect } from 'react'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

/**
 * @param {{ open: boolean, onClose?: () => void, title: string, children: React.ReactNode, size?: 'sm'|'md'|'lg', hideClose?: boolean }} props
 */
export function Modal({ open, onClose, title, children, size = 'md', hideClose = false }) {
  useEffect(() => {
    if (!open || hideClose) return
    const handler = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose, hideClose])

  if (!open) return null

  return (
    <div className={styles.wrapper}>
      {!hideClose && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={onClose}
          aria-label="Fechar modal"
        />
      )}
      {hideClose && <div className={styles.backdrop} />}
      <dialog open className={`${styles.modal} ${styles[size]}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {!hideClose && (
            <button className="btn btn-ghost" onClick={onClose} aria-label="Fechar">
              <X size={18} />
            </button>
          )}
        </div>
        <div className={styles.body}>{children}</div>
      </dialog>
    </div>
  )
}
