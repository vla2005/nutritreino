export function formatPortion(amount, unit) {
  const units = { g: 'g', ml: 'ml', un: 'unidades', colheres: 'colheres', fatias: 'fatias' }
  const number = Number(String(amount).replace(',', '.'))
  const value = amount === '' || amount == null ? '—' : Number.isFinite(number) ? number.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : amount
  const label = number === 1 ? { un: 'unidade', colheres: 'colher', fatias: 'fatia' }[unit] : null
  return `${value} ${label || units[unit] || unit || ''}`.trim()
}
