import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Download, StopCircle, RefreshCw, CheckCircle,
  AlertCircle, ShieldOff, Loader,
} from 'lucide-react'
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner'
import {
  buscarCidadesGuia,
  buscarEspecialidadesGuia,
  buscarMedicosGuia,
  importarLote,
} from '../../services/importacao'
import { useAdmin } from '../../hooks/useAdmin'
import { useAuth } from '../../contexts/AuthContext'
import { UF_LIST } from '../../utils/validators'
import styles from './Importacao.module.css'

const TODO = '__TODOS__'

export function Importacao() {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()

  const [uf, setUf]     = useState('SP')
  const [cidades, setCidades]           = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [cidadeSel, setCidadeSel]       = useState('')
  const [espSel, setEspSel]             = useState('')
  const [loadingFonte, setLoadingFonte] = useState(false)
  const [fonteErro, setFonteErro]       = useState('')
  const [comDetalhes, setComDetalhes]   = useState(false)

  // importação
  const [running, setRunning]   = useState(false)
  const [done, setDone]         = useState(false)
  const cancelRef               = useRef({ cancelled: false })
  const [progresso, setProgresso] = useState({ inseridos: 0, ignorados: 0, erros: [], current: '' })
  const [log, setLog]           = useState([])

  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  async function carregarFonte() {
    setLoadingFonte(true)
    setFonteErro('')
    try {
      const [c, e] = await Promise.all([
        buscarCidadesGuia(uf),
        buscarEspecialidadesGuia({ uf, municipio: 'CAMPINAS' }),
      ])
      setCidades(c)
      setEspecialidades(e)
      setCidadeSel(TODO)
      setEspSel(TODO)
    } catch (err) {
      setFonteErro(err.message + ' (servidor de dev deve estar rodando)')
    } finally {
      setLoadingFonte(false)
    }
  }

  function addLog(msg, tipo = 'info') {
    setLog(prev => [...prev.slice(-500), { msg, tipo, ts: new Date().toLocaleTimeString('pt-BR') }])
  }

  async function iniciarImportacao() {
    cancelRef.current = { cancelled: false }
    setRunning(true)
    setDone(false)
    setLog([])
    setProgresso({ inseridos: 0, ignorados: 0, erros: [], current: '' })

    const cidadesParaProcessar = cidadeSel === TODO ? cidades : cidades.filter(c => c.nome === cidadeSel)
    const espParaProcessar     = espSel    === TODO ? especialidades : especialidades.filter(e => e.nome === espSel)

    let totalIns = 0, totalIgn = 0
    const todosErros = []

    try {
      for (const cidade of cidadesParaProcessar) {
        if (cancelRef.current.cancelled) break
        addLog(`📍 Cidade: ${cidade.nome}`, 'cidade')

        for (const esp of espParaProcessar) {
          if (cancelRef.current.cancelled) break
          addLog(`  🩺 ${esp.nome}...`, 'esp')

          try {
            const prestadores = await buscarMedicosGuia({ uf, municipio: cidade.nome, cdEspecialidade: esp.id })

            if (prestadores.length === 0) { addLog(`     — Nenhum médico`, 'vazio'); continue }

            // snapshot antes do lote para não acumular em dobro via onProgress
            const snapIns = totalIns
            const snapIgn = totalIgn

            const result = await importarLote(prestadores, {
              especialidade: esp.nome, cdEspecialidade: esp.id,
              cidade: cidade.nome, estado: uf, comDetalhes,
              cancelRef: cancelRef.current,
              onProgress: (p) => setProgresso({
                inseridos: snapIns + p.inseridos,
                ignorados: snapIgn + p.ignorados,
                erros: todosErros,
                current: p.current,
              }),
            })

            totalIns += result.inseridos
            totalIgn += result.ignorados
            todosErros.push(...result.erros)
            setProgresso({ inseridos: totalIns, ignorados: totalIgn, erros: todosErros, current: '' })

            const msg = `     ✓ ${result.inseridos} inseridos, ${result.ignorados} ignorados`
              + (result.erros.length ? `, ${result.erros.length} erros` : '')
            addLog(msg, result.erros.length ? 'aviso' : 'ok')

          } catch (e) {
            addLog(`     ✗ Erro: ${e.message}`, 'erro')
            todosErros.push({ nome: esp.nome, erro: e.message })
          }
        }
      }
    } finally {
      setRunning(false)
      setDone(true)
      addLog(`\n🏁 Concluído: ${totalIns} inseridos · ${totalIgn} ignorados · ${todosErros.length} erros`, 'fim')
    }
  }

  function cancelar() {
    cancelRef.current.cancelled = true
    addLog('⛔ Cancelado pelo usuário.', 'aviso')
  }

  // --- Guards ---
  if (authLoading || adminLoading) return <div className="page"><LoadingSpinner fullPage /></div>
  if (!user)    return <Navigate to="/auth" />
  if (!isAdmin) {
    return (
      <div className="page">
        <div className="container">
          <div className={styles.denied}>
            <ShieldOff size={40} />
            <h2>Acesso restrito</h2>
            <p>Esta página é exclusiva para administradores.<br />
              Solicite permissão ao responsável pelo sistema.</p>
          </div>
        </div>
      </div>
    )
  }

  const totalEstimado =
    (cidadeSel === TODO ? cidades.length : 1) *
    (espSel    === TODO ? especialidades.length : 1)

  return (
    <div className="page">
      <div className="container">
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Importação de médicos</h1>
          <p className="text-muted">
            Importa prestadores do Guia Médico (MV Saúde) para o banco do AvaliaMed.<br />
            <strong>Disponível apenas em modo desenvolvimento</strong> — use o script Node.js em produção.
          </p>
        </div>

        {/* 1. Fonte */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>1. Fonte de dados</h2>
          <div className={styles.row}>
            <div className="form-group" style={{ width: 100 }}>
              <label htmlFor="imp-uf">UF</label>
              <select id="imp-uf" className="form-control" value={uf} onChange={e => setUf(e.target.value)}>
                {UF_LIST.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={carregarFonte}
              disabled={loadingFonte || running}
              style={{ alignSelf: 'flex-end' }}
            >
              {loadingFonte
                ? <><LoadingSpinner size={16} /> Carregando...</>
                : <><RefreshCw size={15} /> Carregar cidades e especialidades</>
              }
            </button>
          </div>
          {fonteErro && (
            <div className={styles.erroBox}><AlertCircle size={15} /> {fonteErro}</div>
          )}
          {cidades.length > 0 && (
            <p className={styles.meta}>
              {cidades.length} cidades · {especialidades.length} especialidades disponíveis
            </p>
          )}
        </section>

        {/* 2. Escopo */}
        {cidades.length > 0 && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>2. Escopo da importação</h2>
            <div className={styles.row}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="imp-cidade">Cidade</label>
                <select id="imp-cidade" className="form-control" value={cidadeSel} onChange={e => setCidadeSel(e.target.value)}>
                  <option value={TODO}>— Todas as cidades ({cidades.length}) —</option>
                  {cidades.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="imp-esp">Especialidade</label>
                <select id="imp-esp" className="form-control" value={espSel} onChange={e => setEspSel(e.target.value)}>
                  <option value={TODO}>— Todas as especialidades ({especialidades.length}) —</option>
                  {especialidades.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                </select>
              </div>
            </div>

            {totalEstimado > 1 && (
              <p className={styles.estimativa}>
                Estimativa: <strong>{totalEstimado}</strong> requisições à API
                {totalEstimado > 100 && ' · pode demorar vários minutos'}
              </p>
            )}

            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={comDetalhes}
                onChange={e => setComDetalhes(e.target.checked)}
                disabled={running}
              />
              Importar endereços e telefones
              <span className={styles.checkHint}>(+1 req por médico — mais lento)</span>
            </label>

            <div className={styles.acoes}>
              {!running ? (
                <button
                  className="btn btn-primary"
                  onClick={iniciarImportacao}
                  disabled={!cidadeSel || !espSel}
                >
                  <Download size={16} /> Iniciar importação
                </button>
              ) : (
                <button className="btn btn-danger" onClick={cancelar}>
                  <StopCircle size={16} /> Parar importação
                </button>
              )}
            </div>
          </section>
        )}

        {/* 3. Progresso */}
        {(running || done) && (
          <section className={styles.card}>
            <div className={styles.progressHeader}>
              <h2 className={styles.cardTitle}>
                {running ? <><Loader size={16} className={styles.spin} /> Importando...</> : '3. Resultado'}
              </h2>
              <div className={styles.counters}>
                <span className={styles.counterGreen}>{progresso.inseridos} inseridos</span>
                <span className={styles.counterGray}>{progresso.ignorados} ignorados</span>
                {progresso.erros.length > 0 && (
                  <span className={styles.counterRed}>{progresso.erros.length} erros</span>
                )}
              </div>
            </div>

            {running && progresso.current && (
              <p className={styles.currentItem}>
                <Loader size={13} className={styles.spin} /> {progresso.current}
              </p>
            )}

            <div className={styles.logBox} ref={logRef}>
              {log.map((l, i) => (
                <p key={i} className={`${styles.logLine} ${styles[`log_${l.tipo}`]}`}>
                  <span className={styles.logTs}>{l.ts}</span> {l.msg}
                </p>
              ))}
              {running && <p className={styles.logLine} style={{ opacity: .5 }}>▌</p>}
            </div>

            {done && (
              <div className={styles.doneBox}>
                <CheckCircle size={18} />
                <span>
                  Importação finalizada — <strong>{progresso.inseridos}</strong> inseridos,{' '}
                  <strong>{progresso.ignorados}</strong> ignorados
                  {progresso.erros.length > 0 && <>, <strong>{progresso.erros.length}</strong> com erro</>}
                </span>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
