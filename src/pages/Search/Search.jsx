import { useNavigate } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import { SearchBar } from '../../components/SearchBar/SearchBar'
import { DoctorCard } from '../../components/DoctorCard/DoctorCard'
import { DoctorForm } from '../../components/DoctorForm/DoctorForm'
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { useSearch } from '../../hooks/useSearch'
import { useState } from 'react'
import styles from './Search.module.css'

export function Search() {
  const navigate = useNavigate()
  const { termo, setTermo, resultados, carregando } = useSearch()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="page">
      <div className="container">
        <h1 className={styles.title}>Buscar médico</h1>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>
          Pesquise por nome, CRM, especialidade ou cidade.
        </p>

        <SearchBar
          value={termo}
          onChange={setTermo}
          placeholder="Ex: cardiologista, Dr. João, CRM 12345..."
          autoFocus
        />

        <div className={styles.results}>
          {carregando && <LoadingSpinner size={28} />}

          {!carregando && termo && resultados.length === 0 && (
            <EmptyState
              title="Nenhum médico encontrado"
              description={`Não encontramos resultados para "${termo}".`}
              action={
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  <PlusCircle size={16} /> Cadastrar médico
                </button>
              }
            />
          )}

          {!carregando && !termo && (
            <p className="text-muted text-center" style={{ padding: '2rem 0' }}>
              Digite algo para pesquisar...
            </p>
          )}

          {!carregando && resultados.map(m => (
            <DoctorCard key={m.id} medico={m} />
          ))}
        </div>
      </div>

      <DoctorForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onCadastrado={m => { setShowForm(false); navigate(`/medico/${m.id}`) }}
      />
    </div>
  )
}
