import styles from './LoadingSpinner.module.css'

export function LoadingSpinner({ size = 32, fullPage = false }) {
  const spinner = (
    <span className={styles.spinner} style={{ width: size, height: size }} />
  )
  if (fullPage) {
    return <div className={styles.fullPage}>{spinner}</div>
  }
  return spinner
}
