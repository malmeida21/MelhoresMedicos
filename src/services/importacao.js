import { supabase } from '../supabase/client'

const GUIA_BASE = '/guia-api'
const EMPRESA   = '2'

const TIPO_CONTATO = {
  'TELEFONE COMERCIAL':   'Consultório',
  'TELEFONE RESIDENCIAL': 'Residencial',
  'CELULAR':              'Celular',
  'WHATSAPP':             'WhatsApp',
  'FAX':                  'Fax',
}

function toTitleCase(str) {
  if (!str) return ''
  const prep = new Set(['de','da','do','das','dos','e','a','o','para','com','em','na','no','nas','nos'])
  return str.trim().toLowerCase().replace(/\b\w+/g, (w, o) =>
    o === 0 || !prep.has(w) ? w[0].toUpperCase() + w.slice(1) : w
  )
}

// ─── Busca na API do Guia ────────────────────────────────────────────────────

export async function buscarCidadesGuia(uf = 'SP') {
  const res = await fetch(`${GUIA_BASE}/cidades?cdUF=${uf}&multiEmpresa=${EMPRESA}`)
  if (!res.ok) throw new Error(`Erro ao buscar cidades (${res.status})`)
  return (await res.json()).data.map(c => ({ id: c.cdmunicipio, nome: c.dsmunicipio }))
}

export async function buscarEspecialidadesGuia({ uf = 'SP', municipio = 'CAMPINAS' } = {}) {
  const res = await fetch(
    `${GUIA_BASE}/especialidades?cdUF=${uf}&dsMunicipio=${encodeURIComponent(municipio)}&dsTpRecurso=MEDICO&multiEmpresa=${EMPRESA}`
  )
  if (!res.ok) throw new Error(`Erro ao buscar especialidades (${res.status})`)
  return (await res.json()).data.map(e => ({ id: e.cdespecialidade, nome: toTitleCase(e.dsespecialidade) }))
}

export async function buscarMedicosGuia({ uf = 'SP', municipio = '', cdEspecialidade = '' } = {}) {
  const res = await fetch(
    `${GUIA_BASE}/prestadores?cdUF=${uf}&dsMunicipio=${encodeURIComponent(municipio)}&dsTpRecurso=MEDICO&cdEspecialidade=${cdEspecialidade}&cdProcedimento=&multiEmpresa=${EMPRESA}&regiaoSaude=N`
  )
  if (!res.ok) throw new Error(`Erro ao buscar médicos (${res.status})`)
  return (await res.json()).data ?? []
}

export async function buscarDetalhesGuia({ cdPrestador, cdEspecialidade, municipio, uf }) {
  const url = `${GUIA_BASE}/prestador/endereco?cdUF=${uf}&cdEspecialidade=${cdEspecialidade}&cdPrestador=${cdPrestador}&dsMunicipio=${encodeURIComponent(municipio)}&multiEmpresa=${EMPRESA}&cdProcedimento=`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Erro ao buscar detalhes (${res.status})`)
  const json = await res.json()
  if (!json.status) throw new Error(json.message || 'Erro na API')
  return json.data
}

// ─── Salvar no Supabase ──────────────────────────────────────────────────────

async function jaExisteMedico(cdExterno, crm, ufCrm, especialidade) {
  if (cdExterno) {
    const { data } = await supabase.from('medicos').select('id')
      .eq('cd_externo', String(cdExterno)).eq('especialidade', especialidade).maybeSingle()
    if (data) return data.id
  }
  if (crm && ufCrm) {
    const { data } = await supabase.from('medicos').select('id')
      .eq('crm', crm).eq('uf_crm', ufCrm).eq('especialidade', especialidade).maybeSingle()
    if (data) return data.id
  }
  return null
}

async function salvarEndereco(medicoId, end) {
  const logradouro = toTitleCase(end.dsendereco)
  if (!logradouro) return

  const { data: existe } = await supabase
    .from('medico_enderecos').select('id')
    .eq('medico_id', medicoId)
    .eq('logradouro', logradouro)
    .eq('numero', end.nrendereco?.trim() ?? '')
    .maybeSingle()

  if (!existe) {
    await supabase.from('medico_enderecos').insert({
      medico_id:   medicoId,
      logradouro,
      numero:      end.nrendereco?.trim()         || null,
      complemento: toTitleCase(end.dscomplemento) || null,
      bairro:      toTitleCase(end.dsbairro)      || null,
      cidade:      end.dsmunicipio                || null,
      estado:      end.cduf                       || null,
      cep:         end.nrcep                      || null,
      tipo:        toTitleCase(end.dstipoendereco ?? 'Atendimento'),
    })
  }
}

async function salvarContato(medicoId, c) {
  if (c.sndivulga !== 'S') return
  const numero = c.dscontato?.trim()
  if (!numero) return

  const { data: existe } = await supabase
    .from('medico_telefones').select('id')
    .eq('medico_id', medicoId)
    .eq('numero', numero)
    .maybeSingle()

  if (!existe) {
    await supabase.from('medico_telefones').insert({
      medico_id: medicoId,
      numero,
      tipo: TIPO_CONTATO[c.dstipocontato] ?? toTitleCase(c.dstipocontato ?? 'Consultório'),
    })
  }
}

async function salvarDetalhes(medicoId, detalhes) {
  for (const end of detalhes.enderecos ?? []) {
    await salvarEndereco(medicoId, end)
    for (const c of end.contatos ?? []) {
      await salvarContato(medicoId, c)
    }
  }
}

// ─── Importação em lote ──────────────────────────────────────────────────────

async function inserirMedico(m, { especialidade, cidade, estado }) {
  const { data, error } = await supabase.from('medicos').insert({
    nome:         toTitleCase(m.nmprestador),
    crm:          m.cdCodConselho || null,
    uf_crm:       m.dsufconselho  || null,
    cpf_cnpj:     m.nrcpfcgc     || null,
    cd_externo:   String(m.cdprestador),
    especialidade,
    cidade:       cidade || null,
    estado:       estado || null,
  }).select('id').single()
  if (error) throw error
  return data.id
}

async function processarPrestador(m, { especialidade, cdEspecialidade, cidade, estado, comDetalhes }) {
  const crm    = m.cdCodConselho || null
  const ufCrm  = m.dsufconselho  || null
  const existe = await jaExisteMedico(m.cdprestador, crm, ufCrm, especialidade)

  if (existe) return { status: 'ignorado', medicoId: existe }

  const medicoId = await inserirMedico(m, { especialidade, cidade, estado })

  if (comDetalhes) {
    try {
      const detalhes = await buscarDetalhesGuia({
        cdPrestador: m.cdprestador, cdEspecialidade,
        municipio: cidade || '', uf: estado || 'SP',
      })
      await salvarDetalhes(medicoId, detalhes)
    } catch { /* falha no detalhe não bloqueia o fluxo */ }
  }

  return { status: 'inserido', medicoId }
}

export async function importarLote(prestadores, {
  especialidade, cdEspecialidade, cidade, estado,
  comDetalhes = false, cancelRef, onProgress,
}) {
  let inseridos = 0, ignorados = 0
  const erros = []

  for (const m of prestadores) {
    if (cancelRef?.cancelled) break
    try {
      const { status } = await processarPrestador(m, { especialidade, cdEspecialidade, cidade, estado, comDetalhes })
      status === 'inserido' ? inseridos++ : ignorados++
    } catch (e) {
      erros.push({ nome: m.nmprestador, erro: e.message })
    }
    onProgress?.({ inseridos, ignorados, erros, current: toTitleCase(m.nmprestador) })
  }

  return { inseridos, ignorados, erros }
}
