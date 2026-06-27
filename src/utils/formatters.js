export function formatarNota(nota) {
  if (nota === null || nota === undefined) return '—'
  return Number(nota).toFixed(1)
}

export function formatarData(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatarCRM(crm, uf) {
  if (!crm) return 'CRM não informado'
  return uf ? `CRM ${crm}/${uf}` : `CRM ${crm}`
}

export function iniciais(nome) {
  if (!nome) return '?'
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('')
}

export function corNota(nota) {
  if (nota >= 8) return 'var(--color-success)'
  if (nota >= 6) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

export function labelNota(nota) {
  if (nota >= 9) return 'Excelente'
  if (nota >= 7) return 'Muito bom'
  if (nota >= 5) return 'Regular'
  return 'Ruim'
}
