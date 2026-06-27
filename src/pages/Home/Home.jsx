import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, Star, Search, PlusCircle } from 'lucide-react'
import { DoctorCard } from '../../components/DoctorCard/DoctorCard'
import { DoctorForm } from '../../components/DoctorForm/DoctorForm'
import { RatingForm } from '../../components/RatingForm/RatingForm'
import { SearchBar } from '../../components/SearchBar/SearchBar'
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { useSearch } from '../../hooks/useSearch'
import { useAuth } from '../../contexts/AuthContext'
import { rankingMedicos, estatisticasGerais } from '../../services/medicos'
import { buscarAvaliacaoUsuario } from '../../services/avaliacoes'
import styles from './Home.module.css'

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { termo, setTermo, resultados, carregando } = useSearch()
  const [ranking, setRanking] = useState([])
  const [stats, setStats] = useState({ totalMedicos: 0, totalAvaliacoes: 0 })
  const [loadingRanking, setLoadingRanking] = useState(true)

  const [showDoctorForm, setShowDoctorForm] = useState(false)
  const [avaliarMedico, setAvaliarMedico] = useState(null)
  const [avaliacaoExistente, setAvaliacaoExistente] = useState(null)

  useEffect(() => {
    Promise.all([rankingMedicos({ limit: 5 }), estatisticasGerais()]).then(([r, s]) => {
      setRanking(r)
      setStats(s)
      setLoadingRanking(false)
    })
  }, [])

  async function handleSelecionarMedico(medico) {
    if (!user) { navigate('/auth'); return }
    const existing = await buscarAvaliacaoUsuario(medico.id, user.id)
    setAvaliacaoExistente(existing)
    setAvaliarMedico(medico)
    setTermo('')
  }

  function handleCadastrado(medico) {
    handleSelecionarMedico(medico)
  }

  const mostrarBusca = termo.trim().length > 0

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Avalie seu médico</h1>
          <p className={styles.heroSub}>
            Ajude outros pacientes encontrando os melhores profissionais da sua região.
          </p>
          <div className={styles.searchWrap}>
            <SearchBar
              value={termo}
              onChange={setTermo}
              placeholder="Buscar por nome, CRM, especialidade ou cidade..."
              autoFocus
            />
          </div>

          {mostrarBusca && (
            <div className={styles.searchResults}>
              {carregando && <LoadingSpinner size={24} />}
              {!carregando && resultados.length === 0 && (
                <EmptyState
                  title="Médico não encontrado"
                  description={`Nenhum resultado para "${termo}"`}
                  action={
                    <button
                      className="btn btn-primary"
                      onClick={() => { setShowDoctorForm(true) }}
                    >
                      <PlusCircle size={16} /> Cadastrar médico
                    </button>
                  }
                />
              )}
              {!carregando && resultados.map(m => (
                <div key={m.id} className={styles.resultItem} onClick={() => handleSelecionarMedico(m)}>
                  <DoctorCard medico={m} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Stats */}
        <section className={styles.statsRow}>
          <div className={styles.statCard}>
            <Stethoscope size={24} className={styles.statIcon} />
            <div>
              <p className={styles.statValue}>{stats.totalMedicos ?? '—'}</p>
              <p className={styles.statLabel}>Médicos cadastrados</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <Star size={24} className={styles.statIcon} />
            <div>
              <p className={styles.statValue}>{stats.totalAvaliacoes ?? '—'}</p>
              <p className={styles.statLabel}>Avaliações realizadas</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <Search size={24} className={styles.statIcon} />
            <div>
              <p className={styles.statValue}>100%</p>
              <p className={styles.statLabel}>Gratuito e sem anúncios</p>
            </div>
          </div>
        </section>

        {/* Top Ranking */}
        <section className={styles.rankSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Star size={18} /> Melhores avaliados
            </h2>
            <a href="/ranking" className="btn btn-outline" style={{ fontSize: '.85rem' }}>
              Ver ranking completo
            </a>
          </div>
          {loadingRanking ? (
            <LoadingSpinner fullPage />
          ) : ranking.length === 0 ? (
            <EmptyState title="Nenhum médico no ranking ainda" description="Seja o primeiro a avaliar!" />
          ) : (
            <div className={styles.rankList}>
              {ranking.map((m, i) => (
                <DoctorCard key={m.id} medico={m} rank={i + 1} />
              ))}
            </div>
          )}
        </section>
      </div>

      <DoctorForm
        open={showDoctorForm}
        onClose={() => setShowDoctorForm(false)}
        onCadastrado={handleCadastrado}
      />

      {avaliarMedico && (
        <RatingForm
          open={!!avaliarMedico}
          onClose={() => setAvaliarMedico(null)}
          medico={avaliarMedico}
          usuarioId={user?.id}
          avaliacaoExistente={avaliacaoExistente}
          onSaved={() => navigate(`/medico/${avaliarMedico.id}`)}
        />
      )}
    </div>
  )
}
