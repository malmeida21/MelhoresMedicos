import { supabase } from '../supabase/client'

export async function listarFavoritos(usuarioId) {
  const { data, error } = await supabase
    .from('favoritos')
    .select('medico_id, medicos_com_stats(*)')
    .eq('usuario_id', usuarioId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data.map(f => f.medicos_com_stats)
}

export async function verificarFavorito(medicoId, usuarioId) {
  const { data, error } = await supabase
    .from('favoritos')
    .select('id')
    .eq('medico_id', medicoId)
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

export async function adicionarFavorito(medicoId, usuarioId) {
  const { error } = await supabase
    .from('favoritos')
    .insert({ medico_id: medicoId, usuario_id: usuarioId })
  if (error) throw error
}

export async function removerFavorito(medicoId, usuarioId) {
  const { error } = await supabase
    .from('favoritos')
    .delete()
    .eq('medico_id', medicoId)
    .eq('usuario_id', usuarioId)
  if (error) throw error
}
