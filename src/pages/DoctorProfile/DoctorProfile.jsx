import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Stethoscope, Heart, PenLine, ArrowLeft, ThumbsUp, Phone, Building2 } from 'lucide-react'
import { NoteDisplay } from '../../components/NoteDisplay/NoteDisplay'
import { RatingCard } from '../../components/RatingCard/RatingCard'
import { RatingForm } from '../../components/RatingForm/RatingForm'
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { buscarMedicoPorId, buscarTelefonesMedico, buscarEnderecosMedico } from '../../services/medicos'
import { listarAvaliacoesMedico, buscarAvaliacaoUsuario } from '../../services/avaliacoes'
import { useFavorite } from '../../hooks/useFavorite'
import { useAuth } from '../../contexts/AuthContext'
import { formatarCRM } from '../../utils/formatters'
import styles from './DoctorProfile.module.css'

export function DoctorProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { favoritado, toggleFavorito } = useFavorite(id)

  const [medico, setMedico] = useState(null)
  const [avaliacoes, setAvaliacoes] = useState([])
  const [telefones, setTelefones] = useState([])
  const [enderecos, setEnderecos] = useState([])
  const [minhaAvaliacao, setMinhaAvaliacao] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function carregar() {
    const [m, avs, tels, ends] = await Promise.all([
      buscarMedicoPorId(id),
      listarAvaliacoesMedico(id),
      buscarTelefonesMedico(id),
      buscarEnderecosMedico(id),
    ])
    setMedico(m)
    setAvaliacoes(avs)
    setTelefones(tels)
    setEnderecos(ends)
    if (user) {
      const minha = await buscarAvaliacaoUsuario(id, user.id)
      setMinhaAvaliacao(minha)
    }
    setLoading(false)
  }

  useEffect(() => { carregar() }, [id, user])

  if (loading) return <div className="page"><LoadingSpinner fullPage /></div>
  if (!medico)  return <div className="page"><EmptyState title="Médico não encontrado" action={<Link to="/" className="btn btn-primary">Voltar ao início</Link>} /></div>

  const pct = medico.total_avaliacoes > 0
    ? Math.round((medico.total_recomendam / medico.total_avaliacoes) * 100)
    : null

  return (
    <div className="page">
      <div className="container">
        <Link to="/" className={styles.back}>
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className={styles.profileCard}>
          <div className={styles.avatarLg}>
            {medico.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
          </div>

          <div className={styles.profileInfo}>
            <h1 className={styles.nome}>{medico.nome}</h1>
            <p className={styles.meta}><Stethoscope size={15} /> {medico.especialidade}</p>
            {(medico.cidade || medico.estado) && (
              <p className={styles.meta}>
                <MapPin size={15} />
                {[medico.cidade, medico.estado].filter(Boolean).join(', ')}
              </p>
            )}
            <p className={styles.crm}>{formatarCRM(medico.crm, medico.uf_crm)}</p>
          </div>

          <div className={styles.profileStats}>
            <NoteDisplay nota={medico.nota_media > 0 ? medico.nota_media : null} size="lg" showLabel />
            <p className={styles.avalCount}>{medico.total_avaliacoes} avaliações</p>
            {pct !== null && (
              <p className={styles.pct}><ThumbsUp size={13} /> {pct}% recomendam</p>
            )}
          </div>

          <div className={styles.profileActions}>
            {user && (
              <button
                className={`btn ${favoritado ? 'btn-danger' : 'btn-outline'}`}
                onClick={toggleFavorito}
                title={favoritado ? 'Remover dos favoritos' : 'Favoritar'}
              >
                <Heart size={16} fill={favoritado ? 'currentColor' : 'none'} />
                {favoritado ? 'Favoritado' : 'Favoritar'}
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => { if (!user) navigate('/auth'); else setShowForm(true) }}
            >
              <PenLine size={16} />
              {minhaAvaliacao ? 'Editar avaliação' : 'Avaliar'}
            </button>
          </div>
        </div>

        {/* Telefones e Endereços */}
        {(telefones.length > 0 || enderecos.length > 0) && (
          <div className={styles.infoGrid}>
            {telefones.length > 0 && (
              <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}><Phone size={15} /> Telefones</h3>
                <ul className={styles.infoList}>
                  {telefones.map(t => (
                    <li key={t.id} className={styles.infoItem}>
                      <a href={`tel:${t.numero.replace(/\D/g, '')}`} className={styles.telLink}>
                        {t.numero}
                      </a>
                      <span className={styles.infoBadge}>{t.tipo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {enderecos.length > 0 && (
              <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}><Building2 size={15} /> Endereços</h3>
                <ul className={styles.infoList}>
                  {enderecos.map((e, i) => (
                    <li key={e.id} className={styles.endItem}>
                      {enderecos.length > 1 && (
                        <span className={styles.endNum}>Endereço {i + 1}</span>
                      )}
                      <address className={styles.address}>
                        {[e.logradouro, e.numero].filter(Boolean).join(', ')}
                        {e.complemento && ` — ${e.complemento}`}
                        {e.bairro && <><br />{e.bairro}</>}
                        {(e.cidade || e.estado) && (
                          <><br />{[e.cidade, e.estado].filter(Boolean).join(' — ')}</>
                        )}
                        {e.cep && <><br />CEP: {e.cep}</>}
                      </address>
                      {(e.logradouro || e.cidade) && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent([e.logradouro, e.numero, e.bairro, e.cidade, e.estado].filter(Boolean).join(', '))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.mapsLink}
                        >
                          Ver no mapa ↗
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <h2 className={styles.avalTitle}>
          Avaliações ({avaliacoes.length})
        </h2>

        {avaliacoes.length === 0 ? (
          <EmptyState
            title="Nenhuma avaliação ainda"
            description="Seja o primeiro a avaliar este médico!"
          />
        ) : (
          <div className={styles.avalList}>
            {avaliacoes.map(a => (
              <RatingCard
                key={a.id}
                avaliacao={a}
                isMine={a.usuario_id === user?.id}
                onEdit={() => setShowForm(true)}
              />
            ))}
          </div>
        )}
      </div>

      <RatingForm
        open={showForm}
        onClose={() => setShowForm(false)}
        medico={medico}
        usuarioId={user?.id}
        avaliacaoExistente={minhaAvaliacao}
        onSaved={carregar}
      />
    </div>
  )
}
