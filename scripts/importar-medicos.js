#!/usr/bin/env node
/**
 * Importação de médicos do Guia Médico (MV Saúde)
 *
 * Uso:
 *   node scripts/importar-medicos.js
 *   node scripts/importar-medicos.js --uf SP
 *   node scripts/importar-medicos.js --uf SP --municipio CAMPINAS
 *   node scripts/importar-medicos.js --uf SP --municipio CAMPINAS --especialidade 42
 *   node scripts/importar-medicos.js --detalhes          (importa endereços e telefones)
 *
 * Sem --municipio: importa TODAS as cidades da UF.
 * Sem --especialidade: importa TODAS as especialidades.
 * Com --detalhes: faz uma requisição extra por médico para importar endereços e telefones.
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  try {
    return Object.fromEntries(
      readFileSync('.env', 'utf-8').split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
    )
  } catch { return {} }
}

const env = loadEnv()
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env')
  process.exit(1)
}

const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY)
const BASE      = 'https://2234prd-plan.cloudmv.com.br/mvsaudeweb/messagebroker/gm'
const EMPRESA   = '2'

// Parse args: suporta --key value e --key=value e flags booleanas (--detalhes)
const args = {}
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i]
  if (!a.startsWith('--')) continue
  const [k, ...v] = a.slice(2).split('=')
  if (v.length) { args[k] = v.join('='); continue }
  const next = process.argv[i + 1]
  if (!next || next.startsWith('--')) { args[k] = true; continue }
  args[k] = next; i++
}

const UF           = (args.uf           || 'SP').toUpperCase()
const MUNICIPIO    = args.municipio ? String(args.municipio).toUpperCase() : null
const FILTRO_ESP   = args.especialidade ? Number(args.especialidade) : null
const DELAY_MS     = Number(args.delay ?? 100)
const COM_DETALHES = args.detalhes === true || args.detalhes === 'true'

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

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function api(path) {
  const res = await fetch(`${BASE}/${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`)
  const json = await res.json()
  return json.data ?? []
}

async function apiDetalhe(path) {
  const res = await fetch(`${BASE}/${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.status) throw new Error(json.message || 'Erro na API de detalhe')
  return json.data
}

async function buscarCidades() {
  return api(`cidades?cdUF=${UF}&multiEmpresa=${EMPRESA}`)
}

async function buscarEspecialidades(municipio) {
  return api(`especialidades?cdUF=${UF}&dsMunicipio=${encodeURIComponent(municipio)}&dsTpRecurso=MEDICO&multiEmpresa=${EMPRESA}`)
}

async function buscarMedicos(municipio, cdEsp) {
  return api(`prestadores?cdUF=${UF}&dsMunicipio=${encodeURIComponent(municipio)}&dsTpRecurso=MEDICO&cdEspecialidade=${cdEsp}&cdProcedimento=&multiEmpresa=${EMPRESA}&regiaoSaude=N`)
}

async function buscarDetalhes(cdPrestador, cdEspecialidade, municipio) {
  return apiDetalhe(`prestador/endereco?cdUF=${UF}&cdEspecialidade=${cdEspecialidade}&cdPrestador=${cdPrestador}&dsMunicipio=${encodeURIComponent(municipio)}&multiEmpresa=${EMPRESA}&cdProcedimento=`)
}

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
    .eq('medico_id', medicoId).eq('logradouro', logradouro).eq('numero', end.nrendereco?.trim() ?? '')
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
    .eq('medico_id', medicoId).eq('numero', numero)
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

async function tentarSalvarDetalhes(medicoId, cdPrestador, cdEspecialidade, cidade) {
  try {
    const detalhes = await buscarDetalhes(cdPrestador, cdEspecialidade, cidade)
    await salvarDetalhes(medicoId, detalhes)
  } catch { /* detalhe opcional — não bloqueia o fluxo */ }
}

async function processarMedico(m, especialidade, cidade, cdEspecialidade) {
  const crm    = m.cdCodConselho || null
  const ufCrm  = m.dsufconselho  || null
  const existe = await jaExisteMedico(m.cdprestador, crm, ufCrm, especialidade)

  if (existe) {
    if (COM_DETALHES) await tentarSalvarDetalhes(existe, m.cdprestador, cdEspecialidade, cidade)
    return 'ignorado'
  }

  const { data, error } = await supabase.from('medicos').insert({
    nome:         toTitleCase(m.nmprestador),
    crm,
    uf_crm:       ufCrm,
    cpf_cnpj:     m.nrcpfcgc   || null,
    cd_externo:   String(m.cdprestador),
    especialidade,
    cidade,
    estado:       UF,
  }).select('id').single()
  if (error) throw new Error(error.message)

  if (COM_DETALHES) await tentarSalvarDetalhes(data.id, m.cdprestador, cdEspecialidade, cidade)

  return 'inserido'
}

function bar(pct, len = 20) {
  const f = Math.round(pct * len)
  return '[' + '█'.repeat(f) + '░'.repeat(len - f) + `] ${Math.round(pct * 100)}%`
}

async function processarEspecialidade(nomeCidade, esp, totals) {
  const nomeEsp = toTitleCase(esp.dsespecialidade)
  const pctEsp  = (esp._idx + 1) / esp._total

  process.stdout.write(`  ${bar(pctEsp)} ${nomeEsp.padEnd(40).slice(0, 40)} `)

  let medicos
  try {
    medicos = await buscarMedicos(nomeCidade, esp.cdespecialidade)
  } catch (e) {
    console.log(`✗ ${e.message}`)
    totals.err++
    return
  }

  if (medicos.length === 0) { console.log('— sem médicos'); return }

  let ins = 0, ign = 0, err = 0
  for (const m of medicos) {
    try {
      const r = await processarMedico(m, nomeEsp, nomeCidade, esp.cdespecialidade)
      r === 'inserido' ? ins++ : ign++
    } catch { err++ }
  }

  totals.ins += ins; totals.ign += ign; totals.err += err
  const errStr = err ? ` / ✗${err}` : ''
  console.log(`+${ins} / =${ign}${errStr}`)

  if (DELAY_MS > 0) await sleep(DELAY_MS)
}

async function processarCidade(ci, cidade, totalCidades, totals) {
  const nomeCidade = cidade.dsmunicipio
  console.log(`\n[${ci + 1}/${totalCidades}] 📍 ${nomeCidade}`)

  let especialidades
  try {
    const raw = await buscarEspecialidades(nomeCidade)
    especialidades = FILTRO_ESP ? raw.filter(e => e.cdespecialidade === FILTRO_ESP) : raw
  } catch (e) {
    console.log(`  ✗ Erro ao buscar especialidades: ${e.message}`)
    return
  }

  for (let ei = 0; ei < especialidades.length; ei++) {
    await processarEspecialidade(nomeCidade, { ...especialidades[ei], _idx: ei, _total: especialidades.length }, totals)
  }
}

async function main() {
  console.log('\n🏥  AvaliaMed — Importação de Médicos')
  console.log(`   UF: ${UF} | Município: ${MUNICIPIO ?? 'TODOS'} | Esp: ${FILTRO_ESP ?? 'TODAS'} | Detalhes: ${COM_DETALHES ? 'sim' : 'não'}\n`)

  const todasCidades = await buscarCidades()
  const cidades = MUNICIPIO ? todasCidades.filter(c => c.dsmunicipio === MUNICIPIO) : todasCidades

  if (cidades.length === 0) { console.error('Nenhuma cidade encontrada.'); process.exit(1) }
  console.log(`📍 ${cidades.length} cidade(s) a processar\n`)

  const totals = { ins: 0, ign: 0, err: 0 }

  for (let ci = 0; ci < cidades.length; ci++) {
    await processarCidade(ci, cidades[ci], cidades.length, totals)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅  Total: ${totals.ins} inseridos · ${totals.ign} ignorados · ${totals.err} erros\n`)
}

try {
  await main()
} catch (e) {
  console.error('Erro:', e.message)
  process.exit(1)
}
