import { supabase } from '../supabase/client'

export async function listarAvaliacoesMedico(medicoId) {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('*')
    .eq('medico_id', medicoId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function buscarAvaliacaoUsuario(medicoId, usuarioId) {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('*')
    .eq('medico_id', medicoId)
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function salvarAvaliacao({ medicoId, usuarioId, nomeAutor, nota, pontosPositivos, pontosNegativos, recomendaria }) {
  const payload = {
    medico_id: medicoId,
    usuario_id: usuarioId,
    nome_autor: nomeAutor || null,
    nota,
    pontos_positivos: pontosPositivos,
    pontos_negativos: pontosNegativos,
    recomendaria,
  }

  const existente = await buscarAvaliacaoUsuario(medicoId, usuarioId)

  if (existente) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .update(payload)
      .eq('id', existente.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('avaliacoes')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function curtirAvaliacao(avaliacaoId, usuarioId) {
  const { error } = await supabase.rpc('curtir_avaliacao', {
    p_avaliacao_id: avaliacaoId,
    p_usuario_id: usuarioId,
  })
  if (error) throw error
}

export async function descurtirAvaliacao(avaliacaoId, usuarioId) {
  const { error } = await supabase.rpc('descurtir_avaliacao', {
    p_avaliacao_id: avaliacaoId,
    p_usuario_id: usuarioId,
  })
  if (error) throw error
}

export async function verificarCurtida(avaliacaoId, usuarioId) {
  const { data, error } = await supabase
    .from('curtidas_avaliacoes')
    .select('id')
    .eq('avaliacao_id', avaliacaoId)
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

export async function denunciarAvaliacao(avaliacaoId, usuarioId, motivo) {
  const { error } = await supabase
    .from('denuncias')
    .insert({ avaliacao_id: avaliacaoId, usuario_id: usuarioId, motivo })
  if (error) throw error
}

export async function verificarDenuncia(avaliacaoId, usuarioId) {
  const { data, error } = await supabase
    .from('denuncias')
    .select('id')
    .eq('avaliacao_id', avaliacaoId)
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (error) throw error
  return !!data
}
