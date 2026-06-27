import { supabase } from '../supabase/client'

export async function buscarMedicos(termo) {
  let query = supabase
    .from('medicos_com_stats')
    .select('*')

  if (termo) {
    const t = `%${termo}%`
    query = query.or(`nome.ilike.${t},crm.ilike.${t},especialidade.ilike.${t},cidade.ilike.${t}`)
  }

  const { data, error } = await query.order('nome')
  if (error) throw error
  return data
}

export async function buscarMedicoPorId(id) {
  const { data, error } = await supabase
    .from('medicos_com_stats')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function buscarTelefonesMedico(medicoId) {
  const { data, error } = await supabase
    .from('medico_telefones')
    .select('*')
    .eq('medico_id', medicoId)
    .order('criado_em')
  if (error) throw error
  return data
}

export async function buscarEnderecosMedico(medicoId) {
  const { data, error } = await supabase
    .from('medico_enderecos')
    .select('*')
    .eq('medico_id', medicoId)
    .order('criado_em')
  if (error) throw error
  return data
}

export async function buscarMedicoSemelhante({ nome, cidade, especialidade }) {
  const { data, error } = await supabase
    .from('medicos')
    .select('*')
    .ilike('nome', `%${nome}%`)
    .ilike('especialidade', `%${especialidade}%`)
    .ilike('cidade', `%${cidade}%`)
    .limit(5)
  if (error) throw error
  return data
}

export async function cadastrarMedico({ telefones, enderecos, ...dadosMedico }) {
  if (dadosMedico.crm && dadosMedico.uf_crm) {
    const { data: existente } = await supabase
      .from('medicos')
      .select('id')
      .eq('crm', dadosMedico.crm)
      .eq('uf_crm', dadosMedico.uf_crm)
      .maybeSingle()
    if (existente) return existente
  }

  const { data: medico, error } = await supabase
    .from('medicos')
    .insert(dadosMedico)
    .select()
    .single()
  if (error) throw error

  if (telefones?.length) {
    const rows = telefones
      .filter(t => t.numero?.trim())
      .map(t => ({ medico_id: medico.id, numero: t.numero.trim(), tipo: t.tipo || 'Consultório' }))
    if (rows.length) await supabase.from('medico_telefones').insert(rows)
  }

  if (enderecos?.length) {
    const rows = enderecos
      .filter(e => e.logradouro?.trim())
      .map(e => ({ medico_id: medico.id, ...e }))
    if (rows.length) await supabase.from('medico_enderecos').insert(rows)
  }

  return medico
}

export async function rankingMedicos({ especialidade, cidade, limit = 50 } = {}) {
  let query = supabase
    .from('medicos_com_stats')
    .select('*')
    .gte('total_avaliacoes', 1)
    .order('nota_media', { ascending: false })
    .order('total_avaliacoes', { ascending: false })
    .limit(limit)

  if (especialidade) query = query.ilike('especialidade', `%${especialidade}%`)
  if (cidade)        query = query.ilike('cidade', `%${cidade}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listarEspecialidades() {
  const { data, error } = await supabase.from('medicos').select('especialidade')
  if (error) throw error
  return [...new Set(data.map(d => d.especialidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export async function listarCidades() {
  const { data, error } = await supabase.from('medicos').select('cidade')
  if (error) throw error
  return [...new Set(data.map(d => d.cidade).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export async function estatisticasGerais() {
  const [{ count: totalMedicos }, { count: totalAvaliacoes }] = await Promise.all([
    supabase.from('medicos').select('*', { count: 'exact', head: true }),
    supabase.from('avaliacoes').select('*', { count: 'exact', head: true }),
  ])
  return { totalMedicos, totalAvaliacoes }
}
