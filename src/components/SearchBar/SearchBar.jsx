import { Search, X } from 'lucide-react'
import styles from './SearchBar.module.css'

export function SearchBar({ value, onChange, placeholder = 'Buscar médico...', autoFocus }) {
  return (
    <div className={styles.wrap}>
      <Search size={18} className={styles.icon} />
      <input
        className={styles.input}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {value && (
        <button className={styles.clear} onClick={() => onChange('')} aria-label="Limpar">
          <X size={16} />
        </button>
      )}
    </div>
  )
}
