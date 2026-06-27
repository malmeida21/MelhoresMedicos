import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { DoctorCard } from '../../components/DoctorCard/DoctorCard'
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { rankingMedicos, listarEspecialidades, listarCidades } from '../../services/medicos'
import styles from './Ranking.module.css'

export function Ranking() {
  const [medicos, setMedicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [especialidades, setEspecialidades] = useState([])
  const [cidades, setCidades] = useState([])

  const [filtroEsp, setFiltroEsp] = useState('')
  const [filtroCid, setFiltroCid] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  async function carregar() {
    setLoading(true)
    const data = await rankingMedicos({
      especialidade: filtroEsp || undefined,
      cidade: filtroCid || undefined,
    })
    setMedicos(data)
    setLoading(false)
  }

  useEffect(() => {
    Promise.all([listarEspecialidades(), listarCidades()]).then(([e, c]) => {
      setEspecialidades(e)
      setCidades(c)
    })
  }, [])

  useEffect(() => { carregar() }, [filtroEsp, filtroCid])

  return (
    <div className="page">
      <div className="container">
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Ranking de médicos</h1>
          </div>
          <button className="btn btn-outline" onClick={() => setShowFilters(v => !v)}>
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>

        {showFilters && (
          <div className={styles.filters}>
            <div className="form-group">
              <label>Especialidade</label>
              <select className="form-control" value={filtroEsp} onChange={e => setFiltroEsp(e.target.value)}>
                <option value="">Todas</option>
                {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cidade</label>
              <select className="form-control" value={filtroCid} onChange={e => setFiltroCid(e.target.value)}>
                <option value="">Todas</option>
                {cidades.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button className="btn btn-outline" onClick={() => { setFiltroEsp(''); setFiltroCid('') }}>
              Limpar filtros
            </button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner fullPage />
        ) : medicos.length === 0 ? (
          <EmptyState
            title="Nenhum médico encontrado"
            description="Tente ajustar os filtros ou aguarde mais avaliações."
          />
        ) : (
          <div className={styles.list}>
            {medicos.map((m, i) => (
              <DoctorCard key={m.id} medico={m} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
