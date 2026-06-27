import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, MapPin, PlusCircle, ArrowLeft } from 'lucide-react'
import { Modal } from '../Modal/Modal'
import { SearchBar } from '../SearchBar/SearchBar'
import { DoctorForm } from '../DoctorForm/DoctorForm'
import { RatingForm } from '../RatingForm/RatingForm'
import { LoadingSpinner } from '../LoadingSpinner/LoadingSpinner'
import { useSearch } from '../../hooks/useSearch'
import { useAuth } from '../../contexts/AuthContext'
import { buscarAvaliacaoUsuario } from '../../services/avaliacoes'
import { formatarCRM, formatarNota } from '../../utils/formatters'
import styles from './AvaliarModal.module.css'

export function AvaliarModal({ open, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { termo, setTermo, resultados, carregando } = useSearch()
  const [showDoctorForm, setShowDoctorForm] = useState(false)
  const [medicoSelecionado, setMedicoSelecionado] = useState(null)
  const [avaliacaoExistente, setAvaliacaoExistente] = useState(null)
  const [loadingSelect, setLoadingSelect] = useState(false)

  async function handleSelecionar(medico) {
    setLoadingSelect(true)
    const existing = user ? await buscarAvaliacaoUsuario(medico.id, user.id) : null
    setAvaliacaoExistente(existing)
    setMedicoSelecionado(medico)
    setLoadingSelect(false)
  }

  function handleCadastrado(medico) {
    setShowDoctorForm(false)
    handleSelecionar(medico)
  }

  function handleClose() {
    setTermo('')
    setMedicoSelecionado(null)
    setAvaliacaoExistente(null)
    onClose()
  }

  function handleSaved() {
    handleClose()
    navigate(`/medico/${medicoSelecionado.id}`)
  }

  const buscando = termo.trim().length > 0

  return (
    <>
      <Modal open={open && !medicoSelecionado} onClose={handleClose} title="Avaliar médico" size="md">
        <div className={styles.wrap}>
          <p className={styles.hint}>
            Busque o médico pelo nome ou CRM. Se não encontrar, cadastre-o.
          </p>

          <SearchBar
            value={termo}
            onChange={setTermo}
            placeholder="Nome, CRM, especialidade ou cidade..."
            autoFocus
          />

          <div className={styles.results}>
            {loadingSelect && <LoadingSpinner size={24} />}

            {!loadingSelect && carregando && (
              <div className={styles.loadingRow}><LoadingSpinner size={22} /> Buscando...</div>
            )}

            {!loadingSelect && !carregando && buscando && resultados.length === 0 && (
              <div className={styles.notFound}>
                <p>Nenhum médico encontrado para <strong>"{termo}"</strong>.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowDoctorForm(true)}
                >
                  <PlusCircle size={16} /> Cadastrar este médico
                </button>
              </div>
            )}

            {!loadingSelect && !carregando && resultados.map(m => (
              <button
                key={m.id}
                className={styles.resultItem}
                onClick={() => handleSelecionar(m)}
              >
                <div className={styles.itemAvatar}>
                  {m.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()}
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemNome}>{m.nome}</span>
                  <span className={styles.itemMeta}>
                    <Stethoscope size={12} /> {m.especialidade}
                  </span>
                  {m.cidade && (
                    <span className={styles.itemMeta}>
                      <MapPin size={12} /> {[m.cidade, m.estado].filter(Boolean).join(', ')}
                    </span>
                  )}
                  <span className={styles.itemCrm}>{formatarCRM(m.crm, m.uf_crm)}</span>
                </div>
                <div className={styles.itemNota}>
                  {m.total_avaliacoes > 0 ? (
                    <>
                      <span className={styles.notaVal}>{formatarNota(m.nota_media)}</span>
                      <span className={styles.notaCount}>{m.total_avaliacoes} aval.</span>
                    </>
                  ) : (
                    <span className={styles.semAval}>Sem avaliações</span>
                  )}
                </div>
              </button>
            ))}

            {!buscando && (
              <div className={styles.empty}>
                <Stethoscope size={32} className={styles.emptyIcon} />
                <p>Digite o nome ou CRM do médico</p>
                <button
                  className="btn btn-outline"
                  style={{ marginTop: '.5rem' }}
                  onClick={() => setShowDoctorForm(true)}
                >
                  <PlusCircle size={15} /> Cadastrar novo médico
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <DoctorForm
        open={showDoctorForm}
        onClose={() => setShowDoctorForm(false)}
        onCadastrado={handleCadastrado}
      />

      {medicoSelecionado && (
        <RatingForm
          open={!!medicoSelecionado}
          onClose={() => setMedicoSelecionado(null)}
          medico={medicoSelecionado}
          usuarioId={user?.id}
          avaliacaoExistente={avaliacaoExistente}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
